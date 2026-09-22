import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing, MIN_TOQUE } from '../src/theme/tokens';
import { PrimaryButton, SecondaryButton } from '../src/components/ui';
import { Icon, type IconName } from '../src/components/Icon';
import { BrandHeader, Card, ProvisionalNotice, SectionLabel } from '../src/components/layout';
import { PermissionPrimer } from '../src/components/PermissionPrimer';
import * as Location from 'expo-location';
import { getFix, type LocationOutcome } from '../src/punch/location';
import { submitPunch, type PunchReceipt } from '../src/punch/queue';
import { buttonLabelForKind, labelForKind, useToday } from '../src/punch/useToday';

/// Registrar ponto — modal de tela cheia.
///
/// O protótipo separa em três artboards (bater ponto → confirmar → facial),
/// mas em uso são estados de uma mesma tela: o funcionário não navega entre
/// elas, ele avança. Manter como três rotas obrigaria a carregar contexto de
/// uma para outra sem ganho nenhum.
///
/// Era uma ABA até agora, o que causava três problemas: a barra de abas
/// cobria a câmera na hora da foto; bater ponto custava dois toques em dois
/// botões idênticos; e cinco abas apertavam os rótulos. Ver o comentário em
/// `app/_layout.tsx`.
type Step = 'idle' | 'locating' | 'selfie' | 'sending' | 'done';

export default function RegistrarScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { nextKind, reload, punches } = useToday();

  const [step, setStep] = useState<Step>('idle');
  const [location, setLocation] = useState<LocationOutcome | null>(null);
  const [receipt, setReceipt] = useState<PunchReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [primerLocal, setPrimerLocal] = useState(false);
  const [primerCamera, setPrimerCamera] = useState(false);
  const [localNegada, setLocalNegada] = useState(false);

  // Estado limpo a cada abertura do modal: ninguém quer encontrar a tela
  // parada no comprovante da marcação anterior.
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        setStep('idle');
        setReceipt(null);
        setError(null);
      };
    }, [reload]),
  );

  /*
   * Início do fluxo.
   *
   * Os dois prompts do sistema (localização e câmera) eram disparados em
   * sequência imediata, sem nenhuma explicação antes. Agora cada um tem seu
   * preparo, e eles ficam separados no tempo: o de localização acontece em
   * `start`, o da câmera só depois que a posição resolveu.
   */
  async function start() {
    setError(null);

    // Primeira vez: explica antes de gastar a única chance do prompt nativo.
    if (!(await Location.getForegroundPermissionsAsync()).granted && !primerLocal) {
      setPrimerLocal(true);
      return;
    }

    await localizarEContinuar();
  }

  async function localizarEContinuar() {
    setPrimerLocal(false);
    setStep('locating');
    const fix = await getFix();
    setLocation(fix);

    // Negada e o sistema não pergunta mais: o preparo volta, agora apontando
    // para os Ajustes em vez de um botão "Permitir" que não faria nada.
    if (fix.status === 'denied') {
      const atual = await Location.getForegroundPermissionsAsync();
      if (!atual.canAskAgain) {
        setLocalNegada(true);
        setPrimerLocal(true);
        setStep('idle');
        return;
      }
    }

    // A selfie só entra se a câmera estiver disponível. Sem permissão,
    // seguimos direto: negar o registro por causa da câmera puniria o
    // funcionário por uma configuração do aparelho.
    if (permission?.granted) {
      setStep('selfie');
      return;
    }

    // Câmera nunca foi pedida: mostra o preparo. Já foi negada: segue sem
    // foto, sem insistir — a marcação é o que a lei exige, a foto não.
    if (permission?.canAskAgain !== false && !permission?.granted) {
      setPrimerCamera(true);
      return;
    }

    setStep('sending');
  }

  async function pedirCamera() {
    setPrimerCamera(false);
    const camera = await requestPermission();
    setStep(camera?.granted ? 'selfie' : 'sending');
  }

  // Quando pulamos a selfie, o envio dispara sozinho.
  useEffect(() => {
    if (step === 'sending' && !receipt) void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function send(selfieKey?: string) {
    // O horário que vale é o do toque, não o da chegada ao servidor.
    const punchedAt = new Date().toISOString();
    const fix = location?.status === 'ok' ? location.fix : undefined;

    try {
      const result = await submitPunch({
        punchedAt,
        kind: nextKind,
        latitude: fix?.latitude,
        longitude: fix?.longitude,
        accuracyMeters: fix?.accuracyMeters,
        selfieKey,
      });
      setReceipt(result);
      setStep('done');

      // Confirmação por três canais, porque o registro de ponto acontece na
      // garagem: tátil (o aparelho pode estar no bolso), sonoro pelo leitor de
      // tela, e visual no comprovante. Só o visual não basta às 5h40 com sol
      // na tela.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const hora = new Date(result?.punchedAt ?? punchedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      // `result` vem nulo quando a marcação entra na fila offline. A distinção
      // importa para quem ouve: "registrada" e "salva no aparelho" são estados
      // diferentes, e o segundo ainda depende de sinal.
      AccessibilityInfo.announceForAccessibility(
        result
          ? `${labelForKind(nextKind)} registrada às ${hora}.`
          : `${labelForKind(nextKind)} salva no aparelho às ${hora}. Será enviada quando houver sinal.`,
      );

      void reload();
    } catch (failure) {
      setError((failure as Error).message);
      setStep('idle');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  if (step === 'selfie') {
    return (
      <SelfieStep
        onCaptured={(foto) => {
          setSelfieUri(foto ?? null);
          setStep('sending');
        }}
        onSkip={() => {
          setSelfieUri(null);
          setStep('sending');
        }}
      />
    );
  }

  if (step === 'done') {
    return (
      <Confirmation
        receipt={receipt}
        kindLabel={labelForKind(nextKind)}
        // Fecha o modal e devolve à home, em vez de voltar ao início do
        // fluxo: a tarefa terminou, e insistir na tela de registro depois do
        // comprovante convida a uma segunda batida por engano.
        onDone={() => {
          setReceipt(null);
          setStep('idle');
          router.back();
        }}
      />
    );
  }

  const busy = step === 'locating' || step === 'sending';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader
        title="Registrar ponto"
        subtitle={`Próxima marcação: ${labelForKind(nextKind)}`}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.lg,
        }}
      >
        {primerLocal ? (
          <Card>
            <PermissionPrimer
              icone="pin"
              titulo="Confirmar que você está na garagem"
              porque="No momento da marcação o app lê a posição do aparelho uma única vez, para registrar de onde o ponto foi batido. Sem ela o ponto é registrado do mesmo jeito — só fica sem a localização."
              negada={localNegada}
              aoPermitir={() => void localizarEContinuar()}
              aoPular={() => {
                setPrimerLocal(false);
                setLocation({ status: 'denied' });
                setStep('sending');
              }}
              rotuloPular="Registrar sem localização"
            />
          </Card>
        ) : primerCamera ? (
          <Card>
            <PermissionPrimer
              icone="face"
              titulo="Uma foto no momento do registro"
              porque="A foto fica guardada no aparelho e serve de conferência se houver dúvida sobre uma marcação. Você pode registrar o ponto sem ela."
              aoPermitir={() => void pedirCamera()}
              aoPular={() => {
                setPrimerCamera(false);
                setStep('sending');
              }}
              rotuloPular="Registrar sem foto"
            />
          </Card>
        ) : null}

        <Card>
          <SectionLabel>Etapas</SectionLabel>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <StepRow
              icon="pin"
              label="Localização na cerca virtual"
              state={stateFor(step, 'locating')}
              detail={locationDetail(step, location)}
            />
            {/* O rótulo diz o que o app REALMENTE faz hoje. Enquanto não
                existir o endpoint de upload, a foto fica no aparelho — e
                chamar isso de "identificação" seria afirmar uma conferência
                biométrica que não acontece, num registro que tem valor
                probatório trabalhista. */}
            <StepRow
              icon="face"
              label="Foto de conferência"
              state={stateFor(step, 'selfie')}
              detail={
                permission?.granted === false
                  ? 'Sem permissão de câmera — o ponto é registrado assim mesmo'
                  : selfieUri
                    ? 'Guardada no aparelho'
                    : undefined
              }
            />
            <StepRow
              icon="check"
              label="Envio e sincronização"
              state={stateFor(step, 'sending')}
            />
          </View>
        </Card>

        {error ? (
          <Text
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={{
              color: c.bad,
              fontFamily: fonts.medium,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        ) : null}

        <PrimaryButton
          label={buttonLabelForKind(nextKind)}
          onPress={start}
          loading={busy}
          disabled={busy}
        />

        <Text
          style={{
            textAlign: 'center',
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          Sem internet, a marcação fica salva no aparelho{'\n'}e é enviada assim que o sinal
          voltar.
        </Text>

        {punches.length > 0 ? (
          <Card>
            <SectionLabel>Já registrado hoje</SectionLabel>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              {punches.map((punch) => (
                <View
                  key={punch.id}
                  style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: c.text2, fontFamily: fonts.medium, fontSize: 14 }}>
                    {labelForKind(punch.kind)}
                  </Text>
                  <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
                    {new Date(punch.punchedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

type StepState = 'done' | 'current' | 'waiting';

function stateFor(step: Step, target: Step): StepState {
  const order: Step[] = ['idle', 'locating', 'selfie', 'sending', 'done'];
  const current = order.indexOf(step);
  const mine = order.indexOf(target);
  if (step === 'done' || current > mine) return 'done';
  if (current === mine) return 'current';
  return 'waiting';
}

function locationDetail(step: Step, location: LocationOutcome | null): string | undefined {
  if (step === 'idle' || !location) return undefined;
  if (location.status === 'ok') {
    const accuracy = location.fix.accuracyMeters;
    return accuracy ? `Precisão de cerca de ${accuracy} m` : 'Posição registrada';
  }
  if (location.status === 'denied') return 'Sem permissão de localização';
  return 'Sem sinal de GPS';
}

function StepRow({
  icon,
  label,
  state,
  detail,
}: {
  icon: IconName;
  label: string;
  state: StepState;
  detail?: string;
}) {
  const { c } = useTheme();

  const chipBg = state === 'done' ? c.brandAction : state === 'current' ? c.brandSoft : c.surface2;
  const chipInk = state === 'done' ? c.onBrand : state === 'current' ? c.brandInk : c.muted;
  const statusText =
    state === 'done' ? 'Concluído' : state === 'current' ? 'Em andamento' : 'Aguardando';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state === 'current' ? (
          <ActivityIndicator size="small" color={c.brandInk} />
        ) : (
          <Icon name={state === 'done' ? 'check' : icon} color={chipInk} size={19} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontFamily: fonts.medium, fontSize: 14 }}>{label}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 1 }}>
          {detail ?? statusText}
        </Text>
      </View>
    </View>
  );
}

/// Tela 13 — foto de conferência.
///
/// A foto AGORA é capturada de verdade. Antes, este comentário dizia que ela
/// era capturada e só faltava enviar — mas não havia `ref` na `CameraView`
/// nem chamada a `takePictureAsync`: a contagem regressiva terminava, a tela
/// marcava "Concluído" com um check verde, e nada tinha sido fotografado.
///
/// O que ainda falta é o envio: sem endpoint de upload para o storage, a URI
/// fica no aparelho e `selfieKey` segue indo vazio em `submitPunch`. Por isso
/// o passo se chama "Foto de conferência" e o detalhe diz "Guardada no
/// aparelho" — o app não afirma ter identificado ninguém.
///
/// Quando o endpoint existir: subir `selfieUri`, e a chave devolvida entra em
/// `selfieKey` na chamada de `submitPunch`.
function SelfieStep({
  onCaptured,
  onSkip,
}: {
  onCaptured: (foto?: string) => void;
  onSkip: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [capturando, setCapturando] = useState(false);

  async function capturar() {
    if (capturando) return;
    setCapturando(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const foto = await camera.current?.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });
      onCaptured(foto?.uri);
    } catch {
      // Falhar a captura não pode bloquear o registro de ponto: o que a lei
      // exige é a marcação, não a foto.
      onCaptured(undefined);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.deep }}>
      <View style={{ flex: 1 }}>
        <CameraView ref={camera} style={{ flex: 1 }} facing="front" />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <View
            style={{
              width: 250,
              height: 320,
              borderRadius: 160,
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.85)',
            }}
          />
        </View>
      </View>

      <View
        style={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            color: '#FFFFFF',
            fontFamily: fonts.display,
            fontSize: 26,
            textAlign: 'center',
          }}
        >
          Centralize o rosto
        </Text>

        {/*
         * Obturador manual, no lugar da contagem regressiva automática.
         *
         * `accessibility.md › Cognitive` pede: *"Minimize use of time-boxed
         * interface elements… Prefer dismissing views with an explicit
         * action."* Uma contagem de 3 s pune quem precisa de mais tempo para
         * se posicionar — e aqui era pior, porque a contagem terminava sem
         * capturar nada.
         */}
        <Pressable
          onPress={capturar}
          disabled={capturando}
          accessibilityRole="button"
          accessibilityLabel="Tirar a foto"
          accessibilityState={{ disabled: capturando, busy: capturando }}
          style={{
            alignSelf: 'center',
            width: 76,
            height: 76,
            borderRadius: 38,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.sm,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: capturando ? 'rgba(255,255,255,0.45)' : '#FFFFFF',
            }}
          />
        </Pressable>

        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Continuar sem selfie"
          style={{ minHeight: MIN_TOQUE, justifyContent: 'center' }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontFamily: fonts.semibold,
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            Continuar sem selfie
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/// Tela 12 — comprovante de registro.
function Confirmation({
  receipt,
  kindLabel,
  onDone,
}: {
  receipt: PunchReceipt | null;
  kindLabel: string;
  onDone: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingTop: insets.top + spacing.xxl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: spacing.xl,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: c.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" color={c.brandAction} size={44} strokeWidth={2.4} />
        </View>

        <Text
          style={{
            color: c.text,
            fontFamily: fonts.display,
            fontSize: 29,
            textAlign: 'center',
          }}
        >
          {kindLabel} registrada
        </Text>

        {receipt ? (
          /*
           * O comprovante como BILHETE, não como cartão de formulário.
           *
           * O NSR é o número que o motorista apresenta se houver disputa sobre
           * uma marcação — é a única coisa nesta tela que ele pode precisar
           * ditar ao telefone ou mandar por mensagem. Então ele ganha o maior
           * peso tipográfico da tela e um botão de copiar, em vez de ser mais
           * uma linha de rótulo e valor.
           *
           * O recorte serrilhado embaixo é o que faz o cartão ler como
           * comprovante destacável em vez de caixa genérica.
           */
          <Card style={{ width: '100%', gap: spacing.md }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>
                Número sequencial do registro
              </Text>
              <Text
                accessibilityLabel={`NSR ${receipt.nsr.split('').join(' ')}`}
                style={{
                  color: c.text,
                  fontFamily: fonts.monoBold,
                  fontSize: 34,
                  letterSpacing: 1,
                }}
              >
                {receipt.nsr}
              </Text>
              <SecondaryButton
                label="Copiar comprovante"
                onPress={() => {
                  void Clipboard.setStringAsync(
                    `Comprovante de ponto — ${kindLabel}\n` +
                      `NSR ${receipt.nsr}\n` +
                      `Horário ${receipt.punchedAt}\n` +
                      `Código ${receipt.hash}\n` +
                      `${receipt.employeeName} · matrícula ${receipt.registration}\n` +
                      `${receipt.companyName}`,
                  );
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  AccessibilityInfo.announceForAccessibility('Comprovante copiado.');
                }}
                style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
              />
            </View>

            {/* Serrilha do bilhete */}
            <View style={{ flexDirection: 'row', gap: 4, overflow: 'hidden' }}>
              {Array.from({ length: 28 }).map((_, i) => (
                <View
                  key={i}
                  style={{ flex: 1, height: 1.5, backgroundColor: c.line, borderRadius: 1 }}
                />
              ))}
            </View>

            <Row label="Horário" value={receipt.punchedAt} />
            <Row label="Código" value={receipt.hash} />

            {receipt.outsideGeofence ? (
              <ProvisionalNotice>
                Registrado fora das áreas cadastradas. A marcação vale; o RH verá a
                sinalização.
              </ProvisionalNotice>
            ) : null}
          </Card>
        ) : (
          <Text
            style={{
              color: c.warn,
              fontFamily: fonts.medium,
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 21,
            }}
          >
            Salva no aparelho.{'\n'}Será enviada assim que houver internet.
          </Text>
        )}
      </View>

      <PrimaryButton label="Concluir" onPress={onDone} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../../src/theme/tokens';
import { PrimaryButton } from '../../src/components/ui';
import { Icon, type IconName } from '../../src/components/Icon';
import { BrandHeader, Card, ProvisionalNotice, SectionLabel } from '../../src/components/layout';
import { getFix, type LocationOutcome } from '../../src/punch/location';
import { submitPunch, type PunchReceipt } from '../../src/punch/queue';
import { buttonLabelForKind, labelForKind, useToday } from '../../src/punch/useToday';

/// Telas 04, 12 e 13 do protótipo, num fluxo só.
///
/// O protótipo separa em três artboards (bater ponto → confirmar → facial),
/// mas em uso são estados de uma mesma tela: o funcionário não navega entre
/// elas, ele avança. Manter como três rotas obrigaria a carregar contexto de
/// uma para outra sem ganho nenhum.
type Step = 'idle' | 'locating' | 'selfie' | 'sending' | 'done';

export default function PontoScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { nextKind, reload, punches } = useToday();

  const [step, setStep] = useState<Step>('idle');
  const [location, setLocation] = useState<LocationOutcome | null>(null);
  const [receipt, setReceipt] = useState<PunchReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Volta ao início sempre que a aba é reaberta: ninguém quer encontrar a tela
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

  async function start() {
    setError(null);
    setStep('locating');
    const fix = await getFix();
    setLocation(fix);

    // A selfie só entra se a câmera estiver disponível. Sem permissão,
    // seguimos direto: negar o registro por causa da câmera puniria o
    // funcionário por uma configuração do aparelho.
    const camera = permission?.granted ? permission : await requestPermission();
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
      void reload();
    } catch (failure) {
      setError((failure as Error).message);
      setStep('idle');
    }
  }

  if (step === 'selfie') {
    return <SelfieStep onCaptured={() => setStep('sending')} onSkip={() => setStep('sending')} />;
  }

  if (step === 'done') {
    return (
      <Confirmation
        receipt={receipt}
        kindLabel={labelForKind(nextKind)}
        onDone={() => {
          setReceipt(null);
          setStep('idle');
        }}
      />
    );
  }

  const busy = step === 'locating' || step === 'sending';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader title="Registrar ponto" subtitle={`Próxima marcação: ${labelForKind(nextKind)}`} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.lg,
        }}
      >
        <Card>
          <SectionLabel>Etapas</SectionLabel>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <StepRow
              icon="pin"
              label="Localização na cerca virtual"
              state={stateFor(step, 'locating')}
              detail={locationDetail(step, location)}
            />
            <StepRow
              icon="face"
              label="Selfie de identificação"
              state={stateFor(step, 'selfie')}
              detail={permission?.granted === false ? 'Sem permissão de câmera' : undefined}
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

  const chipBg = state === 'done' ? c.brand : state === 'current' ? c.brandSoft : c.surface2;
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

/// Tela 13 — identificação facial.
///
/// A foto é capturada mas ainda NÃO é enviada: falta o endpoint de upload para
/// o storage. Quando existir, a chave devolvida entra em `selfieKey` na
/// chamada de `submitPunch` e o fluxo fica completo sem mudar nada aqui.
function SelfieStep({ onCaptured, onSkip }: { onCaptured: () => void; onSkip: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      onCaptured();
      return;
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onCaptured]);

  return (
    <View style={{ flex: 1, backgroundColor: c.deep }}>
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} facing="front" />
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
          style={{
            color: '#FFFFFF',
            fontFamily: fonts.display,
            fontSize: 26,
            textAlign: 'center',
          }}
        >
          CENTRALIZE O ROSTO
        </Text>
        <Text
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontFamily: fonts.regular,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          Capturando em {countdown}…
        </Text>
        <Pressable onPress={onSkip} hitSlop={10}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontFamily: fonts.semibold,
              fontSize: 14,
              textAlign: 'center',
              marginTop: spacing.sm,
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
          <Icon name="check" color={c.brand} size={44} strokeWidth={2.4} />
        </View>

        <Text
          style={{
            color: c.text,
            fontFamily: fonts.display,
            fontSize: 29,
            textAlign: 'center',
          }}
        >
          {kindLabel.toUpperCase()} REGISTRADA
        </Text>

        {receipt ? (
          <Card style={{ width: '100%', gap: spacing.sm }}>
            <Row label="Horário" value={receipt.punchedAt} />
            <Row label="NSR" value={receipt.nsr} />
            <Row label="Código" value={receipt.hash} />
            {receipt.outsideGeofence ? (
              <ProvisionalNotice>
                Registrado fora das áreas cadastradas. A marcação vale; o RH verá a
                sinalização.
              </ProvisionalNotice>
            ) : null}
            <Text
              style={{
                marginTop: spacing.sm,
                color: c.muted,
                fontFamily: fonts.regular,
                fontSize: 12,
                lineHeight: 17,
              }}
            >
              Este é o seu comprovante de registro. Guarde o NSR para qualquer conferência.
            </Text>
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

      <PrimaryButton label="CONCLUIR" onPress={onDone} />
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

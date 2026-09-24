import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts } from '../src/theme/tokens';
import { Avatar, IconButton, PrimaryButton, SecondaryButton } from '../src/components/ui';
import { Card } from '../src/components/layout';
import { Icon } from '../src/components/Icon';
import { EtiquetaMapa, MapaCerca } from '../src/components/MapaCerca';
import { PermissionPrimer } from '../src/components/PermissionPrimer';
import { getFix, type LocationOutcome } from '../src/punch/location';
import { submitPunch } from '../src/punch/queue';
import { labelForKind, useToday } from '../src/punch/useToday';
import { setLastPunch } from '../src/punch/lastReceipt';

/// Tempo da tela de confirmação antes do cancelamento automático (tela 12).
const CANCELAMENTO_S = 60;
/// Contagem regressiva da foto (tela 13).
const CONTAGEM_FOTO = 3;

type Passo =
  | 'verificando'
  | 'permissaoLocal'
  | 'localizando'
  | 'confirmar'
  | 'permissaoCamera'
  | 'facial'
  | 'enviando';

/// Registrar ponto — telas 12 (confirmar registro) e 13 (identificação
/// facial) do protótipo, como um modal de tela cheia aberto pela aba Ponto.
export default function RegistrarScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { employee } = useAuth();
  const { nextKind, reload } = useToday();

  const [passo, setPasso] = useState<Passo>('verificando');
  const [local, setLocal] = useState<LocationOutcome | null>(null);
  const [localNegada, setLocalNegada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();

  // Primeira vez: explica antes de gastar a única chance do prompt nativo.
  useEffect(() => {
    void (async () => {
      const atual = await Location.getForegroundPermissionsAsync();
      if (atual.granted) {
        void localizar();
      } else {
        setLocalNegada(!atual.canAskAgain);
        setPasso('permissaoLocal');
      }
    })();
  }, []);

  async function localizar() {
    setPasso('localizando');
    setLocal(await getFix());
    setPasso('confirmar');
  }

  function confirmar() {
    setErro(null);
    // Sem câmera a marcação segue sem foto: negar o registro por causa da
    // câmera puniria o funcionário por uma configuração do aparelho.
    if (permissaoCamera?.granted) setPasso('facial');
    else if (permissaoCamera?.canAskAgain !== false) setPasso('permissaoCamera');
    else void enviar();
  }

  async function enviar(fotoUri?: string) {
    setPasso('enviando');
    // O horário que vale é o do toque, não o da chegada ao servidor.
    const punchedAt = new Date().toISOString();
    const fix = local?.status === 'ok' ? local.fix : undefined;
    void fotoUri; // A foto fica no aparelho até existir o endpoint de upload.

    try {
      const receipt = await submitPunch({
        punchedAt,
        kind: nextKind,
        latitude: fix?.latitude,
        longitude: fix?.longitude,
        accuracyMeters: fix?.accuracyMeters,
      });
      setLastPunch({ kind: nextKind, at: receipt?.punchedAt ?? punchedAt, receipt });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const hora = new Date(punchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      AccessibilityInfo.announceForAccessibility(
        receipt
          ? `${labelForKind(nextKind)} registrada às ${hora}.`
          : `${labelForKind(nextKind)} salva no aparelho às ${hora}. Será enviada quando houver sinal.`,
      );
      void reload();
      router.back();
    } catch (failure) {
      setErro((failure as Error).message);
      setPasso('confirmar');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  const cabecalho = (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, height: insets.top + 58, justifyContent: 'center' }}>
      <IconButton
        name="chevron-left"
        label="Voltar"
        onPress={() => (passo === 'facial' ? setPasso('confirmar') : router.back())}
      />
    </View>
  );

  if (passo === 'facial' || passo === 'permissaoCamera' || (passo === 'enviando' && permissaoCamera?.granted)) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {cabecalho}
        {passo === 'permissaoCamera' ? (
          <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
            <Card>
              <PermissionPrimer
                icone="face"
                titulo="Uma foto no momento do registro"
                porque="A foto fica guardada no aparelho e serve de conferência se houver dúvida sobre uma marcação. Você pode registrar o ponto sem ela."
                aoPermitir={async () => {
                  const resposta = await pedirPermissaoCamera();
                  if (resposta?.granted) setPasso('facial');
                  else void enviar();
                }}
                aoPular={() => void enviar()}
                rotuloPular="Registrar sem foto"
              />
            </Card>
          </View>
        ) : (
          <Facial enviando={passo === 'enviando'} onCapturada={(uri) => void enviar(uri)} onCancelar={() => router.back()} />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {cabecalho}
      <Confirmar
        nome={employee?.name ?? ''}
        passo={passo}
        local={local}
        localNegada={localNegada}
        rotulo={`Confirmar ${labelForKind(nextKind).toLowerCase()}`}
        erro={erro}
        onPermitirLocal={() => void localizar()}
        onPularLocal={() => {
          setLocal({ status: 'denied' });
          setPasso('confirmar');
        }}
        onConfirmar={confirmar}
        onExpirar={() => router.back()}
        bottom={insets.bottom}
      />
    </View>
  );
}

/// Tela 12 — data e hora grandes, mapa com a faixa de status e o botão de
/// confirmação com cancelamento automático.
function Confirmar({
  nome,
  passo,
  local,
  localNegada,
  rotulo,
  erro,
  onPermitirLocal,
  onPularLocal,
  onConfirmar,
  onExpirar,
  bottom,
}: {
  nome: string;
  passo: Passo;
  local: LocationOutcome | null;
  localNegada: boolean;
  rotulo: string;
  erro: string | null;
  onPermitirLocal: () => void;
  onPularLocal: () => void;
  onConfirmar: () => void;
  onExpirar: () => void;
  bottom: number;
}) {
  const { c } = useTheme();
  const [agora, setAgora] = useState(() => new Date());
  const ativo = passo === 'confirmar';

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const ok = local?.status === 'ok';
  const faixa = passo === 'localizando' || passo === 'verificando'
    ? { texto: 'Validando local', cor: c.brandInk, icon: 'pin' as const }
    : ok
      ? { texto: 'Localização capturada', cor: c.brand, icon: 'check' as const }
      : { texto: 'Sem localização', cor: c.warn, icon: 'alert' as const };
  const etiqueta = ok
    ? local.fix.accuracyMeters
      ? `Precisão de ${local.fix.accuracyMeters} m`
      : 'Posição registrada'
    : local?.status === 'denied'
      ? 'Sem permissão de localização'
      : local?.status === 'unavailable'
        ? 'Sem sinal de GPS'
        : 'Procurando o GPS…';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <View>
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 13 }}>
            {agora.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'flex-end', gap: 9 }}>
            <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 39, lineHeight: 41, letterSpacing: -0.78 }}>
              {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12, paddingBottom: 6 }}>{fusoHorario(agora)}</Text>
            <View style={{ marginBottom: 5 }}>
              <Icon name="cloud" color={c.text} size={20} strokeWidth={1.7} />
            </View>
          </View>
        </View>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 2,
            borderColor: c.brand,
            backgroundColor: c.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Avatar name={nome} size={50} raio={25} fundo="transparent" tinta={c.brandInk} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {passo === 'permissaoLocal' ? (
          <Card style={{ flex: 1, justifyContent: 'center' }}>
            <PermissionPrimer
              icone="pin"
              titulo="Confirmar que você está na garagem"
              porque="No momento da marcação o app lê a posição do aparelho uma única vez, para registrar de onde o ponto foi batido. Sem ela o ponto é registrado do mesmo jeito — só fica sem a localização."
              negada={localNegada}
              aoPermitir={onPermitirLocal}
              aoPular={onPularLocal}
              rotuloPular="Registrar sem localização"
            />
          </Card>
        ) : (
          <MapaCerca raio={168} pino="gota" grade={58} centroY={0.56}>
            <View
              style={{
                position: 'absolute',
                top: 14,
                left: 22,
                right: 22,
                height: 42,
                borderRadius: 12,
                backgroundColor: faixa.cor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
              }}
            >
              {passo === 'localizando' || passo === 'verificando' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name={faixa.icon} color="#FFFFFF" size={17} strokeWidth={2.2} />
              )}
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 13, letterSpacing: 13 * 0.12, textTransform: 'uppercase' }}>
                {faixa.texto}
              </Text>
            </View>
            <View style={{ position: 'absolute', bottom: 14, left: 14 }}>
              <EtiquetaMapa texto={etiqueta} />
            </View>
          </MapaCerca>
        )}
      </View>

      <View style={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: Math.max(bottom, 14) + 16, gap: 12 }}>
        {erro ? (
          <Text accessibilityRole="alert" style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' }}>
            {erro}
          </Text>
        ) : null}
        <PrimaryButton label={rotulo} onPress={onConfirmar} disabled={!ativo} loading={passo === 'enviando'} altura={58} />
        {/* Remonta a cada entrada em 'confirmar', recomeçando dos 60 s. */}
        {ativo ? <Cancelamento onExpirar={onExpirar} /> : null}
      </View>
    </View>
  );
}

/// "Cancelamento automático em N segundos" da tela 12.
function Cancelamento({ onExpirar }: { onExpirar: () => void }) {
  const { c } = useTheme();
  const [restante, setRestante] = useState(CANCELAMENTO_S);

  useEffect(() => {
    const timer = setInterval(() => setRestante((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (restante <= 0) onExpirar();
  }, [restante, onExpirar]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          borderWidth: 1.5,
          borderColor: c.line,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: c.text2, fontFamily: fonts.bold, fontSize: 12 }}>{Math.max(restante, 0)}</Text>
      </View>
      <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12.5 }}>
        {`Cancelamento automático em ${Math.max(restante, 0)} segundos`}
      </Text>
    </View>
  );
}

/// Tela 13 — câmera frontal num painel escuro com a moldura oval, contagem
/// regressiva de 3 s e captura automática.
function Facial({
  enviando,
  onCapturada,
  onCancelar,
}: {
  enviando: boolean;
  onCapturada: (uri?: string) => void;
  onCancelar: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [contagem, setContagem] = useState(CONTAGEM_FOTO);
  const [pronta, setPronta] = useState(false);
  const capturou = useRef(false);
  const pulso = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulso, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  useEffect(() => {
    if (!pronta || enviando) return;
    if (contagem <= 0) {
      if (capturou.current) return;
      capturou.current = true;
      void (async () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
          const foto = await camera.current?.takePictureAsync({ quality: 0.5, skipProcessing: true });
          onCapturada(foto?.uri);
        } catch {
          // Falhar a captura não pode bloquear o registro de ponto.
          onCapturada(undefined);
        }
      })();
      return;
    }
    const timer = setTimeout(() => setContagem((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [contagem, pronta, enviando, onCapturada]);

  const etapasFeitas = CONTAGEM_FOTO - Math.max(contagem, 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text accessibilityRole="header" style={{ color: c.text, fontFamily: fonts.bold, fontSize: 25, lineHeight: 26.25, letterSpacing: -0.5 }}>
          Identificação facial
        </Text>
        <Text style={{ marginTop: 6, color: c.muted, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19.6 }}>
          Segure o aparelho na altura dos olhos e mantenha o rosto dentro da moldura.
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flex: 1, borderRadius: 22, overflow: 'hidden', backgroundColor: c.deep }}>
          <LinearGradient
            colors={['#25382E', '#0B1611', '#050C08']}
            locations={[0, 0.7, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <CameraView ref={camera} style={{ flex: 1, opacity: 0.9 }} facing="front" onCameraReady={() => setPronta(true)} />

          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: '12%' }}>
            {/* Moldura oval: RN só arredonda com raio circular, então a elipse
                do protótipo (`border-radius:50%` em 212×284) vai em SVG. */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 236,
                height: 308,
                opacity: pulso.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0, 0] }),
                transform: [{ scale: pulso.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1.12, 1.12] }) }],
              }}
            >
              <Svg width={236} height={308}>
                <Ellipse cx={118} cy={154} rx={117.5} ry={153.5} stroke="rgba(11,175,41,0.35)" strokeWidth={1} fill="none" />
              </Svg>
            </Animated.View>
            <View style={{ width: 212, height: 284, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={212} height={284} style={{ position: 'absolute' }}>
                <Ellipse cx={106} cy={142} rx={104.5} ry={140.5} stroke={c.brand} strokeWidth={3} fill="rgba(11,175,41,0.06)" />
              </Svg>
              {enviando ? (
                <ActivityIndicator size="large" color="rgba(255,255,255,0.78)" />
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.78)', fontFamily: fonts.bold, fontSize: 71, lineHeight: 74, letterSpacing: -1.4 }}>
                  {pronta ? Math.max(contagem, 1) : ''}
                </Text>
              )}
            </View>
          </View>

          <View style={{ position: 'absolute', bottom: 22, left: 22, right: 22, gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                height: 44,
                paddingHorizontal: 14,
                borderRadius: 13,
                backgroundColor: 'rgba(255,255,255,0.09)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <Icon name={pronta ? 'check' : 'camera'} color="#FFFFFF" size={18} strokeWidth={2} />
              <Text style={{ flex: 1, color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 13 }}>
                {enviando ? 'Enviando a marcação…' : pronta ? 'Câmera pronta · mantenha o rosto na moldura' : 'Abrindo a câmera…'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: CONTAGEM_FOTO }).map((_, i) => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < etapasFeitas ? c.brand : 'rgba(255,255,255,0.22)' }} />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 14) + 16, gap: 10 }}>
        <Text style={{ textAlign: 'center', color: c.text2, fontFamily: fonts.semibold, fontSize: 13 }}>
          {enviando ? 'Registrando…' : pronta ? `Capturando em ${Math.max(contagem, 1)}…` : 'Preparando a câmera…'}
        </Text>
        <SecondaryButton label="Cancelar registro" iconName="x" onPress={onCancelar} disabled={enviando} />
      </View>
    </View>
  );
}

/// "GMT−03:00", como no protótipo.
function fusoHorario(date: Date): string {
  const minutos = -date.getTimezoneOffset();
  const sinal = minutos >= 0 ? '+' : '−';
  const abs = Math.abs(minutos);
  return `GMT${sinal}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

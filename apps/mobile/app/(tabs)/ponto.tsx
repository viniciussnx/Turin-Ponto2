import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { eyebrow, fonts, radius } from '../../src/theme/tokens';
import { TopBar } from '../../src/components/layout';
import { EtiquetaMapa, MapaCerca } from '../../src/components/MapaCerca';
import { Icon, type IconName } from '../../src/components/Icon';
import { labelForKind, useToday } from '../../src/punch/useToday';
import { useLastPunch } from '../../src/punch/lastReceipt';

/// Por quanto tempo a aba mostra o estado "Ponto registrado" depois do envio.
const JANELA_REGISTRADO_MS = 2 * 60_000;

/// Tela 04 do protótipo — "Bater ponto". O toque no botão abre o fluxo de
/// confirmação (tela 12) e a foto (tela 13), em `app/registrar.tsx`.
export default function PontoScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { punches, pending, nextKind, reload } = useToday();
  const ultimo = useLastPunch();
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const registrado = ultimo && now.getTime() - new Date(ultimo.at).getTime() < JANELA_REGISTRADO_MS;
  const botao = registrado
    ? { texto: 'Ponto registrado', icon: 'check' as IconName }
    : { texto: 'Toque para registrar', icon: 'clock' as IconName };

  const horaUltimo = registrado ? formatTime(new Date(ultimo.at)) : null;
  const dica = registrado
    ? ultimo.receipt
      ? `Marcação ${horaUltimo} enviada ao RH · NSR ${ultimo.receipt.nsr}`
      : `Marcação ${horaUltimo} salva no aparelho · envio pendente`
    : 'Localização e foto conferidas no registro';

  const anterior = punches[punches.length - 1];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="Registrar ponto"
        border={false}
        fundo={c.bg}
        onBack={() => router.navigate('/inicio')}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ paddingHorizontal: 18 }}>
          <MapaCerca altura={112} raio={112}>
            <View style={{ position: 'absolute', left: 12, bottom: 10 }}>
              <EtiquetaMapa texto="Posição lida no momento do registro" ponto="ok" />
            </View>
          </MapaCerca>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 26, minHeight: 360 }}>
          <Text style={{ ...eyebrow(c.muted), letterSpacing: 11 * 0.2, marginBottom: 5 }}>Próxima marcação</Text>
          <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.4, marginBottom: 18 }}>
            {registrado ? `${labelForKind(ultimo.kind)} registrada` : `Marcar ${labelForKind(nextKind).toLowerCase()}`}
          </Text>

          <BotaoPulsante
            texto={botao.texto}
            icon={botao.icon}
            onPress={() => router.push('/registrar')}
          />

          <Text style={{ marginTop: 16, color: c.text, fontFamily: fonts.bold, fontSize: 25, lineHeight: 26, letterSpacing: -0.5 }}>
            {formatTime(now)}
          </Text>
          <Text style={{ marginTop: 3, color: c.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' }}>
            {dica}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 18, paddingBottom: 16, gap: 8 }}>
          <Etapa icon="pin" label="Localização na cerca virtual" feito={!!registrado} />
          <Etapa icon="face" label="Selfie de identificação" feito={!!registrado} />
          <Etapa icon="check" label="Envio e sincronização" feito={!!registrado && !!ultimo?.receipt} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2, paddingHorizontal: 6 }}>
            <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
              {anterior
                ? `Última: ${formatTime(new Date(anterior.punchedAt))} · ${labelForKind(anterior.kind)}`
                : 'Nenhuma marcação hoje'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: pending > 0 ? c.warn : c.ok }} />
              <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>
                {pending > 0 ? `${pending} pendente${pending > 1 ? 's' : ''}` : 'Sincronizado'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/*
 * `width:184px; height:184px; border-radius:50%; box-shadow:0 20px 44px -16px
 * rgba(11,175,41,.75)` + anel que pulsa (`tpulse 2.1s`).
 */
function BotaoPulsante({ texto, icon, onPress }: { texto: string; icon: IconName; onPress: () => void }) {
  const { c } = useTheme();
  const pulso = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulso, { toValue: 1, duration: 2100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  return (
    <View style={{ width: 184, height: 184, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 192,
          height: 192,
          borderRadius: 96,
          borderWidth: 2,
          borderColor: c.brand,
          opacity: pulso.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0, 0] }),
          transform: [{ scale: pulso.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1.45, 1.45] }) }],
        }}
      />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={texto}
        style={({ pressed }) => ({
          width: 184,
          height: 184,
          borderRadius: 92,
          backgroundColor: pressed ? c.brandActionPressed : c.brand,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          shadowColor: '#0BAF29',
          shadowOpacity: 0.55,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 18 },
          elevation: 8,
        })}
      >
        <Icon name={icon} color="#FFFFFF" size={40} strokeWidth={1.7} />
        <Text
          style={{
            maxWidth: 140,
            color: '#FFFFFF',
            fontFamily: fonts.bold,
            fontSize: 14,
            lineHeight: 17,
            letterSpacing: 14 * 0.12,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {texto}
        </Text>
      </Pressable>
    </View>
  );
}

function Etapa({ icon, label, feito }: { icon: IconName; label: string; feito: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 52,
        paddingHorizontal: 14,
        borderRadius: radius.lg,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line2,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 9,
          backgroundColor: feito ? c.brand : c.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={feito ? 'check' : icon} color={feito ? '#FFFFFF' : c.muted} size={15} strokeWidth={2.4} />
      </View>
      <Text style={{ flex: 1, color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: feito ? c.brandInk : c.muted, fontFamily: fonts.medium, fontSize: 12 }}>
        {feito ? 'Concluído' : 'Aguardando'}
      </Text>
    </View>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import { TurinLogo } from '../src/components/ui';
import { fonts } from '../src/theme/tokens';

/// Tempo mínimo da abertura, para a tela não piscar quando o armazenamento
/// seguro responde rápido.
const MINIMO_MS = 900;

/// Porteiro do app + tela 01 do protótipo ("Abertura").
export default function Index() {
  const { employee, mustChangePassword, ready } = useAuth();
  const [minimo, setMinimo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinimo(true), MINIMO_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || !minimo) return <Splash />;
  if (!employee) return <Redirect href="/login" />;
  if (mustChangePassword) return <Redirect href="/trocar-senha" />;
  return <Redirect href="/inicio" />;
}

/*
 * `background: radial-gradient(120% 80% at 50% 12%, #0BAF29, #07752b 42%,
 * #04150c)` + listras diagonais a 14% de opacidade. RN não tem degradê
 * radial; o linear de cima para baixo com as mesmas paradas chega perto.
 */
export function Splash() {
  const insets = useSafeAreaInsets();
  const brilho = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(brilho, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [brilho]);

  return (
    <View style={{ flex: 1, backgroundColor: '#07130D', overflow: 'hidden' }}>
      <LinearGradient
        colors={['#0BAF29', '#07752B', '#04150C']}
        locations={[0.05, 0.42, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Listras diagonais (`repeating-linear-gradient(115deg, …)`). */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          right: -200,
          bottom: -200,
          opacity: 0.14,
          transform: [{ rotate: '25deg' }],
          flexDirection: 'row',
        }}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <View key={i} style={{ width: 27, height: '100%', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.9)' }} />
        ))}
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 26, paddingHorizontal: 44, paddingTop: insets.top }}>
        <TurinLogo color="#FFFFFF" width={250} />
        <View style={{ width: 56, height: 1, backgroundColor: 'rgba(255,255,255,0.45)' }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 34, lineHeight: 36, letterSpacing: -0.68 }}>
            Meu Ponto
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: 'rgba(255,255,255,0.72)',
              fontFamily: fonts.medium,
              fontSize: 14,
              letterSpacing: 14 * 0.34,
              textTransform: 'uppercase',
            }}
          >
            Turin Transportes
          </Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 18, paddingHorizontal: 44, paddingBottom: insets.bottom + 54 }}>
        <View style={{ width: 150, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
          <Animated.View
            style={{
              width: '44%',
              height: '100%',
              borderRadius: 2,
              backgroundColor: '#FFFFFF',
              transform: [{ translateX: brilho.interpolate({ inputRange: [0, 1], outputRange: [-80, 150] }) }],
            }}
          />
        </View>
        <Text
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: fonts.medium,
            fontSize: 12,
            letterSpacing: 12 * 0.2,
            textTransform: 'uppercase',
          }}
        >
          Sincronizando marcações
        </Text>
      </View>
    </View>
  );
}

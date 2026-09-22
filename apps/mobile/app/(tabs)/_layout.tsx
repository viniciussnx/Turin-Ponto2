import { Tabs } from 'expo-router';
import { Platform, Text, useWindowDimensions, type ColorValue } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../src/components/Icon';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts } from '../../src/theme/tokens';
import { TETO_ABA } from '../../src/theme/useScale';

/*
 * Barra de abas: Início, Ponto, Espelho, Pedidos, Perfil.
 *
 * MATERIAL ("Liquid Glass"). A barra flutua sobre conteúdo que rola por baixo
 * — é exatamente a camada funcional onde o iOS usa material translúcido, e o
 * único lugar do app onde o desfoque tem função em vez de enfeite: dá a
 * sensação de profundidade e deixa o conteúdo continuar visível por trás.
 *
 * O que dá e o que não dá em React Native:
 *  - `expo-blur` entrega o desfoque de verdade no iOS (UIVisualEffectView).
 *  - No Android o suporte é irregular e caro; ali a barra fica OPACA, que é
 *    o comportamento certo para a plataforma de qualquer forma.
 *  - Reduzir Transparência: `BlurView` já cai para sólido quando o sistema
 *    pede, mas a borda e a cor de fundo abaixo garantem a legibilidade.
 *
 * ESCALA DO RÓTULO. `typography.md › Conveying hierarchy` abre exceção
 * explícita: *"when people increase text size to read the content in a tabbed
 * window, they don't expect the tab titles to increase in size."* Sem o teto,
 * "Espelho" e "Pedidos" truncavam nos tamanhos de acessibilidade.
 */
export default function TabsLayout() {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();

  const vidro = Platform.OS === 'ios';
  // A barra cresce um pouco com o texto, mas com teto: ela não pode comer a
  // tela quando o Dynamic Type está no máximo.
  const alturaBase = 58 + Math.round((Math.min(fontScale, TETO_ABA) - 1) * 22);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brandInk,
        tabBarInactiveTintColor: c.muted,
        tabBarBackground: vidro
          ? () => (
              <BlurView
                tint={isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
                intensity={80}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            )
          : undefined,
        tabBarStyle: {
          // Transparente só onde há vidro; no Android segue sólida.
          backgroundColor: vidro ? 'transparent' : c.surface,
          borderTopColor: c.line,
          position: vidro ? 'absolute' : 'relative',
          elevation: 0,
          height: alturaBase + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0),
        },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen name="inicio" options={tab('Início', 'home')} />
      <Tabs.Screen name="espelho" options={tab('Espelho', 'mirror')} />
      <Tabs.Screen name="pedidos" options={tab('Pedidos', 'inbox')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'user')} />
    </Tabs>
  );
}

function tab(title: string, icon: IconName) {
  return {
    title,
    // `maxFontSizeMultiplier` é prop do <Text>, não chave de estilo — por isso
    // o rótulo é renderizado à mão em vez de configurado por `tabBarLabelStyle`.
    tabBarLabel: ({ color }: { color: ColorValue }) => (
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={TETO_ABA}
        style={{ color: color as string, fontFamily: fonts.medium, fontSize: 11 }}
      >
        {title}
      </Text>
    ),
    // O `color` chega como `ColorValue`, que aceita também o token opaco de
    // plataforma. Aqui vêm sempre as cores do tema, que são string.
    tabBarIcon: ({ color }: { color: ColorValue }) => (
      <Icon name={icon} color={color as string} size={23} />
    ),
  };
}

import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../src/components/Icon';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts } from '../../src/theme/tokens';

/// Barra de abas do protótipo: Início, Ponto, Espelho, Pedidos, Perfil.
export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.line,
          // A barra do protótipo é alta e arejada; no Android o inset costuma
          // vir 0 e a barra ficaria colada na borda.
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0),
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="inicio" options={tab('Início', 'home')} />
      <Tabs.Screen name="ponto" options={tab('Ponto', 'clock')} />
      <Tabs.Screen name="espelho" options={tab('Espelho', 'mirror')} />
      <Tabs.Screen name="pedidos" options={tab('Pedidos', 'inbox')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'user')} />
    </Tabs>
  );
}

function tab(title: string, icon: IconName) {
  return {
    title,
    // O `color` chega como `ColorValue`, que aceita também o token opaco de
    // plataforma. Aqui vêm sempre as cores do tema, que são string.
    tabBarIcon: ({ color }: { color: ColorValue }) => (
      <Icon name={icon} color={color as string} size={23} />
    ),
  };
}

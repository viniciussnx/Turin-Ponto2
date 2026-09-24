import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { TETO_ABA } from '../theme/useScale';
import { Icon, type IconName } from './Icon';

/// Abas do protótipo, na ordem dele.
export const ABAS: { name: string; label: string; icon: IconName }[] = [
  { name: 'inicio', label: 'Início', icon: 'home' },
  { name: 'ponto', label: 'Ponto', icon: 'clock' },
  { name: 'escala', label: 'Escala', icon: 'calendar' },
  { name: 'pedidos', label: 'Pedidos', icon: 'inbox' },
  { name: 'perfil', label: 'Perfil', icon: 'user' },
];

/*
 * Barra de abas do protótipo: `background:var(--surface); border-top:1px solid
 * var(--line); padding:10px 6px 26px`. Cada item tem `min-width:60px;
 * min-height:46px`, ícone de 23 pt com traço 1,7 e rótulo `600 10px` com
 * `letter-spacing:.03em`. Ativo: `--brand`; inativo: `--muted`.
 */
/// Telas internas que o protótipo mostra com a barra de abas, e a aba que
/// fica acesa nelas.
export const OCULTAS: Record<string, string> = { ajustes: 'pedidos', notificacoes: 'inicio' };

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { c } = useTheme();
  const atual = state.routes[state.index]?.name ?? '';
  const acesa = OCULTAS[atual] ?? atual;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 6,
        paddingBottom: Math.max(insets.bottom, 12) + 4,
        backgroundColor: c.surface,
        borderTopWidth: 1,
        borderTopColor: c.line,
      }}
    >
      {state.routes.map((route, index) => {
        const aba = ABAS.find((item) => item.name === route.name);
        if (!aba) return null;
        const focused = route.name === acesa;
        const color = focused ? c.brand : c.muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={aba.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={{ minWidth: 60, minHeight: 46, alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            <Icon name={aba.icon} color={color} size={23} strokeWidth={1.7} />
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={TETO_ABA}
              style={{ color, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.3 }}
            >
              {aba.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

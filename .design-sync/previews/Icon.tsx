import { Icon, Text, View, fonts, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;
const NOMES = [
  'home', 'clock', 'mirror', 'inbox', 'user', 'pin', 'face', 'check', 'swap', 'doc', 'calendar',
  'alert', 'bell', 'moon', 'shield', 'coffee', 'bus', 'chevron-down', 'chevron-up',
  'chevron-right', 'chevron-left', 'plus', 'camera', 'lock', 'logout',
] as const;

// O conjunto completo do app.
export const Todos = () => (
  <View style={{ width: 360, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
    {NOMES.map((n) => (
      <View key={n} style={{ width: 60, alignItems: 'center', gap: 4 }}>
        <Icon name={n} color={c.text2} />
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 9 }}>{n}</Text>
      </View>
    ))}
  </View>
);

// Cores de uso: tinta da marca, muted, alerta, branco sobre o verde.
export const Cores = () => (
  <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
    <Icon name="clock" color={c.brandInk} size={26} />
    <Icon name="chevron-right" color={c.muted} size={26} />
    <Icon name="alert" color={c.warn} size={26} />
    <View style={{ backgroundColor: c.brandAction, borderRadius: 8, padding: 6 }}>
      <Icon name="plus" color="#FFFFFF" size={26} />
    </View>
  </View>
);

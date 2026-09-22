import { LinearGradient, TurinLogo, View, brandGradient, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;

// Sobre o degradê do login.
export const SobreDegrade = () => (
  <LinearGradient
    colors={[...brandGradient]}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 1 }}
    style={{ width: 342, padding: spacing.xl, borderRadius: 16 }}
  >
    <TurinLogo color="#FFFFFF" width={152} />
  </LinearGradient>
);

export const SobreClaro = () => (
  <View style={{ width: 342, padding: spacing.xl, backgroundColor: c.surface }}>
    <TurinLogo color={c.brandInk} width={148} />
  </View>
);

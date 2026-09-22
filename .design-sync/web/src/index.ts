// Entrada do design system para o Claude Design.
//
// Tudo aqui é reexportação dos componentes REAIS de apps/mobile/src — nada é
// reimplementado. O build (../build.mjs) troca `react-native` por
// `react-native-web` só para que eles rodem no navegador do Claude Design; o
// app continua sendo Android e iOS.

// Componentes de ui.tsx
export {
  TurinLogo,
  PrimaryButton,
  SecondaryButton,
  Field,
  Checkbox,
  PersonIcon,
  LockIcon,
} from '../../../apps/mobile/src/components/ui';

// Componentes de layout.tsx
export {
  BrandHeader,
  Screen,
  Card,
  SectionLabel,
  ChipFilters,
  UnderlineTabs,
  Tag,
  ListRow,
  Toggle,
  StatTile,
  EmptyState,
  ProvisionalNotice,
} from '../../../apps/mobile/src/components/layout';

export { Icon } from '../../../apps/mobile/src/components/Icon';
export type { IconName } from '../../../apps/mobile/src/components/Icon';
export { ReguaDia, EixoRegua } from '../../../apps/mobile/src/components/ReguaDia';
export { DateTimeField } from '../../../apps/mobile/src/components/DateTimeField';
export { PermissionPrimer } from '../../../apps/mobile/src/components/PermissionPrimer';

// Tema e tokens
export { ThemeProvider, useTheme } from '../../../apps/mobile/src/theme/ThemeProvider';
export {
  turin,
  palettes,
  brandGradient,
  spacing,
  radius,
  fonts,
  MIN_TOQUE,
  ALTURA_ABAS,
} from '../../../apps/mobile/src/theme/tokens';
export type { Palette, ThemeName } from '../../../apps/mobile/src/theme/tokens';

export { TurinProvider } from './TurinProvider';

// Primitivas que as telas do app usam, para compor layout no mesmo idioma do
// código de produção (View/Text/StyleSheet, não <div>).
export {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
export { LinearGradient } from 'expo-linear-gradient';
export { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  InterTight_600SemiBold,
  InterTight_700Bold,
} from '@expo-google-fonts/inter-tight';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/// Inter + Inter Tight + JetBrains Mono: as mesmas três famílias do painel de
/// férias da Turin, para que os três sistemas leiam como um produto só.
///
/// A raiz do app segura o splash até `loaded` virar true — sem isso a primeira
/// tela pisca na fonte do sistema e depois salta.
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InterTight_600SemiBold,
    InterTight_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });
  return loaded;
}

import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/public-sans';

/// Public Sans, a família única do protótipo no Claude Design.
///
/// A raiz do app segura o splash até `loaded` virar true — sem isso a primeira
/// tela pisca na fonte do sistema e depois salta.
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
  });
  return loaded;
}

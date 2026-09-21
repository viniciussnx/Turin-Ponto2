import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
  useFonts,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';

/// Barlow + Barlow Condensed sao a tipografia do protótipo. Sem elas a tela
/// cai na fonte do sistema e o desenho perde a identidade, entao a raiz do app
/// segura o splash ate `loaded` virar true.
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });
  return loaded;
}

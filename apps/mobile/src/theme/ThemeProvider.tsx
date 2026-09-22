import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type Palette, type ThemeName } from './tokens';
import { usePreferences } from '../prefs/usePreferences';

interface ThemeValue {
  name: ThemeName;
  c: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/*
 * Tema do app.
 *
 * Segue o sistema por padrão e respeita a preferência do perfil quando ela
 * existe. Antes, o interruptor "Tema escuro" gravava em AsyncStorage e o
 * provedor nunca lia: o usuário ligava e não acontecia nada. Um controle que
 * não faz o que diz é pior que um controle ausente.
 *
 * `darkMode === null` significa "seguir o sistema" — que é o padrão que o
 * iOS espera, e o motivo de o `userInterfaceStyle` do app.json ser
 * "automatic".
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const { prefs, ready } = usePreferences();

  const value = useMemo<ThemeValue>(() => {
    // Enquanto as preferências não carregaram, seguir o sistema evita um
    // salto de tema no primeiro quadro.
    const escuro = !ready || prefs.darkMode === null ? scheme === 'dark' : prefs.darkMode === true;
    const name: ThemeName = escuro ? 'dark' : 'light';
    return { name, c: palettes[name], isDark: escuro };
  }, [scheme, prefs.darkMode, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return value;
}

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type Palette, type ThemeName } from './tokens';

interface ThemeValue {
  name: ThemeName;
  c: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/// Segue o tema do sistema. O protótipo tem os dois temas prontos, e o
/// "Tema escuro" do perfil (tela 08) vai sobrescrever isto quando existir.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();

  const value = useMemo<ThemeValue>(() => {
    const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
    return { name, c: palettes[name], isDark: name === 'dark' };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return value;
}

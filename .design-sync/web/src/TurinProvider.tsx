import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// `ThemeContext` é privado no app; o build (../build.mjs) só acrescenta um
// `export` a ele, sem mudar mais nada, para que o tema possa ser fixado aqui.
// @ts-expect-error exportado apenas no build web
import { ThemeContext, ThemeProvider } from '../../../apps/mobile/src/theme/ThemeProvider';
import { palettes } from '../../../apps/mobile/src/theme/tokens';

/**
 * Raiz obrigatória de qualquer tela ou componente do Meu Ponto Turin.
 *
 * Reproduz a raiz do app (`app/_layout.tsx`): `SafeAreaProvider` por fora e o
 * tema por dentro. Sem ela `useTheme()` lança erro e nada renderiza.
 *
 * `tema="sistema"` usa o `ThemeProvider` real do app, que segue o aparelho e a
 * preferência salva no perfil. `claro` e `escuro` fixam a paleta.
 */
export function TurinProvider({
  children,
  tema = 'claro',
  insetTopo = 0,
  insetBase = 0,
}: {
  children: ReactNode;
  /** Paleta: `claro` (padrão), `escuro`, ou `sistema` para seguir o aparelho. */
  tema?: 'claro' | 'escuro' | 'sistema';
  /** Área segura superior simulada (a barra de status do celular), em pt. */
  insetTopo?: number;
  /** Área segura inferior simulada (o indicador de início do iPhone), em pt. */
  insetBase?: number;
}) {
  const metrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: insetTopo, bottom: insetBase, left: 0, right: 0 },
  };

  const conteudo =
    tema === 'sistema' ? (
      <ThemeProvider>{children}</ThemeProvider>
    ) : (
      <ThemeContext.Provider
        value={{
          name: tema === 'escuro' ? 'dark' : 'light',
          c: palettes[tema === 'escuro' ? 'dark' : 'light'],
          isDark: tema === 'escuro',
        }}
      >
        {children}
      </ThemeContext.Provider>
    );

  return <SafeAreaProvider initialMetrics={metrics}>{conteudo}</SafeAreaProvider>;
}

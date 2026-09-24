import { useCallback } from 'react';
import { setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useTheme } from './ThemeProvider';

/// Telas com cabeçalho verde ou escuro no topo (início, perfil, gestor,
/// login, abertura) pedem os ícones da barra de status em branco enquanto
/// estão em foco; ao sair, volta o padrão do tema.
export function useBarraClara(): void {
  const { isDark } = useTheme();
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle(isDark ? 'light' : 'dark');
    }, [isDark]),
  );
}

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/auth/AuthProvider';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useAppFonts } from '../src/theme/useAppFonts';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    // Só solta o splash quando Barlow estiver pronta: sem isso a primeira tela
    // pisca na fonte do sistema e depois salta para a certa.
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigation() {
  const { c, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'fade',
        }}
      >
        {/*
         * Registrar ponto é uma AÇÃO, não uma seção do app — e era uma aba.
         * Isso criava três problemas de uma vez: a barra de abas ficava por
         * cima da câmera na hora da foto; bater ponto custava dois toques em
         * dois botões idênticos (o da home levava à aba, a aba tinha o botão
         * de verdade); e cinco abas apertavam os rótulos.
         *
         * `navigation-and-search.md` reserva a barra de abas para seções do
         * mesmo nível que a pessoa alterna. Uma tarefa com começo, meio e fim
         * é modal: ela cobre a tela, tem saída explícita e devolve ao ponto de
         * partida. O botão da home agora dispara a ação direto.
         */}
        <Stack.Screen
          name="registrar"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}

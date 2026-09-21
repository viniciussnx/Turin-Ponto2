import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import { useTheme } from '../src/theme/ThemeProvider';

/// Porteiro do app. Enquanto le o armazenamento seguro mostra o fundo do
/// splash, para nao haver piscada branca entre o splash nativo e a primeira tela.
export default function Index() {
  const { employee, mustChangePassword, ready } = useAuth();
  const { c } = useTheme();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.deep }} />;
  if (!employee) return <Redirect href="/login" />;
  if (mustChangePassword) return <Redirect href="/trocar-senha" />;
  return <Redirect href="/inicio" />;
}

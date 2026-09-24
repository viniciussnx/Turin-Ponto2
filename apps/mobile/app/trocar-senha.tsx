import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, type TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import { useTheme } from '../src/theme/ThemeProvider';
import { useBarraClara } from '../src/theme/useBarraClara';
import { fonts } from '../src/theme/tokens';
import { Field, PrimaryButton, TurinLogo } from '../src/components/ui';

/// Troca da senha. Obrigatória no primeiro acesso: enquanto
/// `mustChangePassword` for true, o `app/index.tsx` devolve o usuário para cá.
/// O protótipo não tem artboard própria; a tela segue o desenho do login
/// (tela 02).
export default function ChangePasswordScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { changePassword, employee, signOut, mustChangePassword } = useAuth();
  useBarraClara();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);

  const mismatch = confirmation.length > 0 && next !== confirmation;
  const canSubmit = current.length >= 6 && next.length >= 8 && next === confirmation && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      // `changePassword` desloga: o servidor revoga as sessões ao trocar a senha.
      await changePassword(current, next);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ height: insets.top, backgroundColor: c.deep }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <LinearGradient
          colors={['#0BAF29', '#06651F']}
          locations={[0, 0.92]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ paddingTop: 30, paddingHorizontal: 30, paddingBottom: 26, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', right: -40, top: -30, width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }} />
          <TurinLogo color="#FFFFFF" width={120} />
          <Text accessibilityRole="header" style={{ marginTop: 18, color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 25, lineHeight: 27, letterSpacing: -0.5 }}>
            Crie sua senha
          </Text>
          <Text style={{ marginTop: 6, color: 'rgba(255,255,255,0.82)', fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }}>
            {mustChangePassword
              ? `${employee?.name?.split(' ')[0] ?? ''}, a senha que o RH passou é provisória. Escolha uma senha sua para continuar.`
              : 'Troque a senha de acesso ao app.'}
          </Text>
        </LinearGradient>

        <View style={{ paddingTop: 30, paddingHorizontal: 30, gap: 16 }}>
          <Field
            label={mustChangePassword ? 'Senha provisória' : 'Senha atual'}
            value={current}
            onChangeText={setCurrent}
            leadingIcon="lock"
            secure
            // A senha provisória vem em maiúsculas, mas forçar o teclado em
            // caixa alta num campo mascarado esconde o que foi digitado.
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="next"
            onSubmitEditing={() => nextRef.current?.focus()}
            editable={!loading}
          />
          <Field
            ref={nextRef}
            label="Nova senha"
            value={next}
            onChangeText={setNext}
            leadingIcon="lock"
            secure
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmationRef.current?.focus()}
            editable={!loading}
          />
          <Field
            ref={confirmationRef}
            label="Repita a nova senha"
            value={confirmation}
            onChangeText={setConfirmation}
            leadingIcon="lock"
            secure
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={mismatch ? 'As senhas não conferem.' : error}
            editable={!loading}
          />

          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 13 }}>A nova senha precisa ter pelo menos 8 caracteres.</Text>

          <PrimaryButton label="Salvar senha" onPress={handleSubmit} loading={loading} disabled={!canSubmit} altura={56} />

          <Pressable
            onPress={() => (mustChangePassword || !router.canGoBack() ? void signOut() : router.back())}
            hitSlop={10}
            accessibilityRole="button"
            style={{ alignSelf: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: c.muted, fontFamily: fonts.semibold, fontSize: 14 }}>
              {mustChangePassword || !router.canGoBack() ? 'Sair' : 'Cancelar'}
            </Text>
          </Pressable>
        </View>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

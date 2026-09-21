import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, spacing } from '../src/theme/tokens';
import { Field, LockIcon, PrimaryButton } from '../src/components/ui';

/// Troca obrigatória da senha inicial gerada pelo RH.
///
/// Não há como pular: enquanto `mustChangePassword` for true, o `app/index.tsx`
/// devolve o usuário para cá. A senha do RH circula em papel ou no WhatsApp, e
/// não pode continuar valendo depois do primeiro acesso.
export default function ChangePasswordScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { changePassword, employee, signOut } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);

  const mismatch = confirmation.length > 0 && next !== confirmation;
  const canSubmit =
    current.length >= 6 && next.length >= 8 && next === confirmation && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await changePassword(current, next);
      // `changePassword` desloga: o servidor revoga as sessões ao trocar a senha.
      // O usuário volta ao login e entra com a senha nova.
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingTop: insets.top + spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: c.text,
            fontFamily: fonts.display,
            fontSize: 30,
            letterSpacing: 0.4,
          }}
        >
          CRIE SUA SENHA
        </Text>
        <Text
          style={{
            marginTop: spacing.sm,
            marginBottom: spacing.xl,
            color: c.text2,
            fontFamily: fonts.regular,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {employee?.name?.split(' ')[0]}, a senha que o RH passou é provisória.
          Escolha uma senha sua para continuar.
        </Text>

        <View style={{ gap: spacing.lg }}>
          <Field
            label="Senha provisória"
            value={current}
            onChangeText={setCurrent}
            leading={<LockIcon color={c.muted} />}
            secure
            autoCapitalize="characters"
            returnKeyType="next"
            onSubmitEditing={() => nextRef.current?.focus()}
            editable={!loading}
          />
          <Field
            ref={nextRef}
            label="Nova senha"
            value={next}
            onChangeText={setNext}
            leading={<LockIcon color={c.muted} />}
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
            leading={<LockIcon color={c.muted} />}
            secure
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={mismatch ? 'As senhas não conferem' : error}
            editable={!loading}
          />

          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 13 }}>
            A nova senha precisa ter pelo menos 8 caracteres.
          </Text>

          <PrimaryButton
            label="SALVAR SENHA"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          />

          <Text
            onPress={() => void signOut()}
            style={{
              marginTop: spacing.md,
              textAlign: 'center',
              color: c.muted,
              fontFamily: fonts.semibold,
              fontSize: 14,
            }}
          >
            Sair
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

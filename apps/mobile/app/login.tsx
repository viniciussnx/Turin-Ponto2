import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import { useTheme } from '../src/theme/ThemeProvider';
import { brandGradient, fonts, radius, spacing } from '../src/theme/tokens';
import { Checkbox, Field, LockIcon, PersonIcon, PrimaryButton, TurinLogo } from '../src/components/ui';

/// A redefinição passa pelo RH de propósito: o cadastro do Alterdata não traz
/// e-mail nem celular confiáveis para todos os 203 funcionários, então não há
/// canal seguro para um "enviar link de recuperação".
function showForgotPassword(): void {
  Alert.alert(
    'Esqueci a senha',
    'Procure o RH para gerar uma nova senha inicial. ' +
      'Você recebe uma senha provisória e troca por uma sua no primeiro acesso.',
    [{ text: 'Entendi' }],
  );
}

/// Tela 02 do protótipo — "BEM-VINDO DE VOLTA".
export default function LoginScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, lastRegistration } = useAuth();

  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  // Quem já entrou uma vez não digita a matrícula de novo.
  useEffect(() => {
    if (lastRegistration) setRegistration(lastRegistration);
  }, [lastRegistration]);

  const canSubmit = registration.trim().length > 0 && password.length >= 6 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(registration, password, keepSignedIn);
      // A navegação é do `app/index.tsx`: ele decide entre trocar senha e início.
    } catch (failure) {
      setError((failure as Error).message);
      setPassword('');
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
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={[...brandGradient]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: spacing.xxl,
            paddingHorizontal: spacing.xl,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <TurinLogo color="#FFFFFF" width={152} />
          <Text
            style={{
              marginTop: spacing.xl,
              color: '#FFFFFF',
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 36,
              letterSpacing: 0.4,
            }}
          >
            BEM-VINDO{'\n'}DE VOLTA
          </Text>
        </LinearGradient>

        <View style={{ padding: spacing.xl, gap: spacing.lg, flex: 1 }}>
          <Field
            label="Matrícula"
            value={registration}
            onChangeText={setRegistration}
            leading={<PersonIcon color={c.muted} />}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="04182"
            editable={!loading}
          />

          <Field
            ref={passwordRef}
            label="Senha"
            value={password}
            onChangeText={setPassword}
            leading={<LockIcon color={c.muted} />}
            secure
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={error}
            editable={!loading}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Checkbox
              checked={keepSignedIn}
              onChange={setKeepSignedIn}
              label="Manter conectado"
            />
            <Pressable onPress={showForgotPassword} hitSlop={8}>
              <Text style={{ color: c.brand, fontFamily: fonts.semibold, fontSize: 14 }}>
                Esqueci a senha
              </Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="ENTRAR"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={{ marginTop: spacing.sm }}
          />

          <Text
            style={{
              marginTop: 'auto',
              paddingTop: spacing.xl,
              textAlign: 'center',
              color: c.muted,
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 19,
            }}
          >
            Primeiro acesso? Peça a senha inicial ao RH.{'\n'}
            Você troca por uma senha sua ao entrar.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

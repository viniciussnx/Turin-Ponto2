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
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import { useTheme } from '../src/theme/ThemeProvider';
import { useBarraClara } from '../src/theme/useBarraClara';
import { eyebrow, fonts, radius } from '../src/theme/tokens';
import { Checkbox, Field, PrimaryButton, TurinLogo } from '../src/components/ui';
import { Icon } from '../src/components/Icon';

/// A redefinição passa pelo RH de propósito: o cadastro do Alterdata não traz
/// e-mail nem celular confiáveis para todos os funcionários, então não há
/// canal seguro para um "enviar link de recuperação".
function showForgotPassword(): void {
  Alert.alert(
    'Esqueci a senha',
    'Procure o RH para gerar uma nova senha inicial. ' +
      'Você recebe uma senha provisória e troca por uma sua no primeiro acesso.',
    [{ text: 'Entendi' }],
  );
}

/// O botão existe no protótipo; a entrada por biometria ainda não foi
/// implementada (falta guardar a credencial no Keychain/Keystore).
function showFaceIdSoon(): void {
  Alert.alert(
    'Entrar com Face ID',
    'A entrada por biometria ainda não está disponível. Use matrícula e senha.',
    [{ text: 'Entendi' }],
  );
}

/// Tela 02 do protótipo — "Bem-vindo de volta".
export default function LoginScreen() {
  const { c } = useTheme();
  useBarraClara();
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

  const versao = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Faixa da barra de status: `background:var(--deep)`. */}
      <View style={{ height: insets.top, backgroundColor: c.deep }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        {/* `height:196px; background:linear-gradient(160deg,#0BAF29,#06651f 92%)` */}
        <LinearGradient
          colors={['#0BAF29', '#06651F']}
          locations={[0, 0.92]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ height: 196, paddingTop: 30, paddingHorizontal: 30, overflow: 'hidden' }}
        >
          <View
            style={{
              position: 'absolute',
              right: -40,
              top: -30,
              width: 200,
              height: 200,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 10,
              top: 40,
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
            }}
          />
          <TurinLogo color="#FFFFFF" width={150} />
          <Text
            accessibilityRole="header"
            style={{
              marginTop: 22,
              color: '#FFFFFF',
              fontFamily: fonts.bold,
              fontSize: 25,
              lineHeight: 26.25,
              letterSpacing: -0.5,
            }}
          >
            Bem-vindo{'\n'}de volta
          </Text>
        </LinearGradient>

        <View style={{ paddingTop: 30, paddingHorizontal: 30, gap: 16, backgroundColor: c.surface }}>
          <Field
            label="Matrícula"
            value={registration}
            onChangeText={setRegistration}
            leadingIcon="user"
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
            leadingIcon="lock"
            secure
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            error={error}
            editable={!loading}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox checked={keepSignedIn} onChange={setKeepSignedIn} label="Manter conectado" />
            <Pressable onPress={showForgotPassword} hitSlop={10} accessibilityRole="button">
              <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 14 }}>Esqueci a senha</Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="Entrar"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            altura={56}
            style={{ marginTop: 6 }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6, marginBottom: 2 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
            <Text style={eyebrow(c.muted)}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
          </View>

          <Pressable
            onPress={showFaceIdSoon}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 56,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: pressed ? c.brand : c.line,
              backgroundColor: c.surface,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 11,
            })}
          >
            <Icon name="face" color={c.text} size={22} strokeWidth={1.7} />
            <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>Entrar com Face ID</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />
        <Text
          style={{
            paddingTop: 22,
            paddingHorizontal: 30,
            paddingBottom: insets.bottom + 30,
            textAlign: 'center',
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 12,
          }}
        >
          {`Turin Transportes · v${versao} · Senha inicial com o RH`}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

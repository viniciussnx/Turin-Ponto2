import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { eyebrow, fonts, radius, MIN_TOQUE } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

/*
 * Componentes base, no desenho do protótipo "Turin Transports Ponto App"
 * (Claude Design). Cada bloco cita o trecho de CSS que reproduz.
 */

/// Marca da Turin. No protótipo ela vai sempre branca sobre o verde
/// (`filter: brightness(0) invert(1)`); o `tintColor` faz esse papel.
export function TurinLogo({ color, width = 150 }: { color: string; width?: number }) {
  return (
    <Image
      source={require('../../assets/turin-logo.webp')}
      style={{ width, height: width * 0.28 }}
      resizeMode="contain"
      tintColor={color}
      accessibilityLabel="Turin Transportes"
    />
  );
}

/*
 * Botão principal: `height:54px; border-radius:14px; background:var(--brand);
 * font:700 14px; letter-spacing:.14em; text-transform:uppercase;
 * box-shadow:0 12px 24px -12px rgba(11,175,41,.9)`.
 */
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  iconName,
  style,
  destrutivo,
  haptico = true,
  altura = 54,
  sombra = true,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /// Elemento livre à esquerda do rótulo.
  icon?: ReactNode;
  /// Atalho: ícone do sprite, branco, 20 pt.
  iconName?: IconName;
  style?: ViewStyle;
  destrutivo?: boolean;
  haptico?: boolean;
  altura?: number;
  sombra?: boolean;
}) {
  const { c } = useTheme();
  const inactive = disabled || loading;
  const fundo = destrutivo ? c.bad : c.brandAction;

  return (
    <Pressable
      onPress={() => {
        if (haptico) {
          void Haptics.impactAsync(
            destrutivo ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium,
          );
        }
        onPress();
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          height: altura,
          borderRadius: radius.lg,
          backgroundColor: pressed && !destrutivo ? c.brandActionPressed : fundo,
          opacity: inactive ? 0.55 : pressed && destrutivo ? 0.85 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: 18,
        },
        sombra && !inactive
          ? {
              shadowColor: destrutivo ? c.bad : '#0BAF29',
              shadowOpacity: 0.45,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 10 },
              elevation: 4,
            }
          : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.onBrand} />
      ) : (
        <>
          {icon ?? (iconName ? <Icon name={iconName} color={c.onBrand} size={20} strokeWidth={2} /> : null)}
          <Text
            style={{
              color: c.onBrand,
              fontFamily: fonts.bold,
              fontSize: 14,
              letterSpacing: 14 * 0.14,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/*
 * Botão de contorno: `height:50px; border:1px solid var(--line);
 * border-radius:14px; background:var(--surface); font:600 14px`.
 * `tom="bad"` é o "Sair da conta" do perfil.
 */
export function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
  iconName,
  tom = 'default',
  altura = 50,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  iconName?: IconName;
  tom?: 'default' | 'text' | 'bad';
  altura?: number;
}) {
  const { c } = useTheme();
  const tinta = tom === 'bad' ? c.bad : tom === 'text' ? c.text : c.text2;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          height: altura,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: pressed && tom !== 'bad' ? c.brand : c.line,
          backgroundColor: pressed && tom === 'bad' ? c.badSoft : c.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          paddingHorizontal: 16,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {iconName ? (
            <Icon
              name={iconName}
              color={pressed && tom !== 'bad' ? c.brandInk : tinta}
              size={19}
            />
          ) : null}
          <Text
            style={{
              color: pressed && tom !== 'bad' ? c.brandInk : tinta,
              fontFamily: fonts.semibold,
              fontSize: 14,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/// Botão quadrado de 40 pt com borda (voltar, filtro, fechar).
export function IconButton({
  name,
  onPress,
  label,
  cor,
  fundo,
}: {
  name: IconName;
  onPress?: () => void;
  label: string;
  cor?: string;
  fundo?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: pressed ? c.surface2 : (fundo ?? c.surface),
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon name={name} color={cor ?? c.text} size={20} strokeWidth={1.9} />
    </Pressable>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  /// Ícone à esquerda: `user` na matrícula, `lock` na senha.
  leading?: ReactNode;
  leadingIcon?: IconName;
  secure?: boolean;
  error?: string | null;
}

/*
 * Campo do login: rótulo em versalete (`font:600 11px; letter-spacing:.14em`),
 * caixa de 54 pt com raio 14 sobre `--surface2`. Em foco a borda vira 1,5 pt
 * `--brand`, o fundo vira `--surface` e ganha o halo de 4 pt `--brand-soft`.
 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, leading, leadingIcon, secure, error, style, multiline, ...props },
  ref,
) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const mascarado = secure && !revealed;
  // No protótipo os ícones do campo saem na cor do texto (o 'stroke' inline
  // perde para o 'currentColor' do sprite).
  const corIcone = c.text;

  return (
    <View>
      <Text style={{ ...eyebrow(c.muted), letterSpacing: 11 * 0.14, marginBottom: 8 }}>{label}</Text>

      {/* Halo de foco: uma borda externa de 4 pt, como o box-shadow do CSS. */}
      <View
        style={{
          margin: -4,
          padding: 3,
          borderRadius: radius.lg + 4,
          borderWidth: 1,
          borderColor: focused && !error ? c.brandSoft : 'transparent',
          backgroundColor: focused && !error ? c.brandSoft : 'transparent',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: 12,
            minHeight: 54,
            paddingHorizontal: 16,
            paddingVertical: multiline ? 12 : 0,
            borderRadius: radius.lg,
            borderWidth: focused || error ? 1.5 : 1,
            borderColor: error ? c.bad : focused ? c.brand : c.line,
            backgroundColor: focused ? c.surface : c.surface2,
          }}
        >
          {leading ?? (leadingIcon ? <Icon name={leadingIcon} color={corIcone} size={20} strokeWidth={1.7} /> : null)}
          <TextInput
            ref={ref}
            {...props}
            multiline={multiline}
            accessibilityLabel={props.accessibilityLabel ?? label}
            accessibilityHint={error ?? undefined}
            secureTextEntry={mascarado}
            onFocus={(event) => {
              setFocused(true);
              props.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              props.onBlur?.(event);
            }}
            placeholderTextColor={c.muted}
            style={[
              {
                flex: 1,
                color: c.text,
                fontFamily: mascarado ? fonts.bold : fonts.semibold,
                fontSize: mascarado ? 18 : 17,
                letterSpacing: mascarado ? 18 * 0.32 : 17 * 0.04,
                paddingVertical: multiline ? 0 : 14,
                minHeight: multiline ? 72 : undefined,
                textAlignVertical: multiline ? 'top' : 'center',
              },
              multiline ? { fontFamily: fonts.regular, fontSize: 15, letterSpacing: 0 } : null,
              style,
            ]}
          />
          {secure ? (
            <Pressable
              onPress={() => setRevealed((value) => !value)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Icon name={revealed ? 'eye-off' : 'eye'} color={c.text} size={20} strokeWidth={1.7} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ marginTop: 8, color: c.bad, fontFamily: fonts.medium, fontSize: 13 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

/// Caixa de seleção do "Manter conectado": 20 pt, raio 6, preenchida de
/// `--brand` com o visto branco.
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  const { c } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: MIN_TOQUE }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          borderWidth: checked ? 0 : 1.5,
          borderColor: c.line,
          backgroundColor: checked ? c.brand : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="check" color="#FFFFFF" size={14} strokeWidth={2.6} /> : null}
      </View>
      <Text style={{ color: c.text2, fontFamily: fonts.medium, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

/// Iniciais do nome ("Ricardo Alves de Souza" → "RA").
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 2 || /^[A-ZÀ-Ú]/.test(part))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/// Avatar quadrado arredondado com iniciais (home, perfil, gestor).
export function Avatar({
  name,
  size = 40,
  fundo,
  tinta,
  raio,
}: {
  name: string;
  size?: number;
  fundo?: string;
  tinta?: string;
  raio?: number;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: raio ?? Math.round(size * 0.3),
        backgroundColor: fundo ?? '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: tinta ?? c.brandInk,
          fontFamily: fonts.bold,
          fontSize: Math.round(size * 0.37),
          letterSpacing: 0.3,
        }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

/// Compatibilidade: ícones de campo do login.
export function PersonIcon({ color }: { color: string }) {
  return <Icon name="user" color={color} size={20} strokeWidth={1.7} />;
}

export function LockIcon({ color }: { color: string }) {
  return <Icon name="lock" color={color} size={20} strokeWidth={1.7} />;
}

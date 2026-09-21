import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius, spacing } from '../theme/tokens';

/// Marca da Turin. O traço é vazado, então sobre o verde ela aparece em branco
/// e sobre fundo claro, em verde — o `tintColor` faz esse papel.
export function TurinLogo({ color, width = 148 }: { color: string; width?: number }) {
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

/// Botão principal — o "ENTRAR" e o "REGISTRAR SAÍDA" do protótipo:
/// caixa alta, Barlow Condensed, cantos arredondados, verde da marca.
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          backgroundColor: inactive ? c.muted : pressed ? c.brandInk : c.brand,
          borderRadius: radius.md,
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.onBrand} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: c.onBrand,
              fontFamily: fonts.display,
              fontSize: 17,
              letterSpacing: 1.1,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  /// Ícone à esquerda, como no protótipo (pessoa na matrícula, cadeado na senha).
  leading?: ReactNode;
  /// Habilita o olho de revelar senha.
  secure?: boolean;
  error?: string | null;
}

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, leading, secure, error, style, ...props },
  ref,
) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 1.4,
          color: c.muted,
        }}
      >
        {label.toUpperCase()}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: c.surface2,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? c.bad : focused ? c.brand : c.line,
          paddingHorizontal: spacing.md,
          minHeight: 52,
        }}
      >
        {leading}
        <TextInput
          ref={ref}
          {...props}
          secureTextEntry={secure && !revealed}
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
              fontFamily: fonts.medium,
              fontSize: 16,
              paddingVertical: spacing.md,
            },
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
            <EyeIcon open={revealed} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 13 }}>{error}</Text>
      ) : null}
    </View>
  );
});

/// Caixa de seleção do "Manter conectado".
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
      accessibilityState={{ checked }}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? c.brand : c.line,
          backgroundColor: checked ? c.brand : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? (
          <View
            style={{
              width: 9,
              height: 5,
              borderLeftWidth: 2,
              borderBottomWidth: 2,
              borderColor: c.onBrand,
              transform: [{ rotate: '-45deg' }, { translateY: -1 }],
            }}
          />
        ) : null}
      </View>
      <Text style={{ color: c.text2, fontFamily: fonts.medium, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

/// Ícones desenhados com View em vez de uma biblioteca: são poucos e simples,
/// e assim o bundle não carrega um pacote de ícones inteiro por causa de três.
function EyeIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 20,
          height: 13,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1.8, borderColor: color }}
        />
      </View>
      {!open ? (
        <View
          style={{
            position: 'absolute',
            width: 24,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '-40deg' }],
          }}
        />
      ) : null}
    </View>
  );
}

export function PersonIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'flex-start' }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: color }}
      />
      <View
        style={{
          width: 16,
          height: 9,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: color,
          marginTop: 2,
        }}
      />
    </View>
  );
}

export function LockIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 11,
          height: 8,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: 16,
          height: 11,
          borderRadius: 3,
          borderWidth: 1.8,
          borderColor: color,
        }}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
});

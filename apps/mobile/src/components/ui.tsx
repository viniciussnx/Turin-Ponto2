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
import { fonts, radius, spacing, MIN_TOQUE } from '../theme/tokens';
import { useScale, TETO_ROTULO } from '../theme/useScale';

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

/*
 * Botão principal.
 *
 * Três mudanças em relação ao desenho anterior, todas do relatório:
 *
 * 1. O fundo é `brandAction` (turin-700), não o verde da marca. Branco sobre o
 *    verde da marca dá 2,93:1 e reprova em qualquer tamanho; sobre o 700 dá
 *    6,18:1. O pressionado agora ESCURECE (800, 8,41:1) — antes clareava, e o
 *    botão ficava mais legível apertado do que em repouso.
 *
 * 2. Saiu o caixa alta com entrelinha de 1,1. O iOS usa sentence case em
 *    botão; o versalete espaçado era o que fazia a tela ler como template.
 *
 * 3. `minHeight` cresce com o Dynamic Type em vez de cortar o texto a 200%.
 */
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  style,
  /// Ação destrutiva (cancelar pedido, sair). Muda a cor e o retorno tátil.
  destrutivo,
  /// Retorno tátil ao tocar. Ligado por padrão em ação primária.
  haptico = true,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  destrutivo?: boolean;
  haptico?: boolean;
}) {
  const { c } = useTheme();
  const { alturaMin } = useScale();
  const inactive = disabled || loading;

  const fundo = destrutivo ? c.bad : c.brandAction;
  const fundoPressionado = destrutivo ? c.bad : c.brandActionPressed;
  const tinta = destrutivo ? '#FFFFFF' : c.onBrand;

  return (
    <Pressable
      onPress={() => {
        if (haptico) {
          void Haptics.impactAsync(
            destrutivo
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Medium,
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
          backgroundColor: inactive ? c.muted : pressed ? fundoPressionado : fundo,
          opacity: pressed && destrutivo ? 0.85 : 1,
          borderRadius: radius.md,
          minHeight: alturaMin(52),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tinta} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: tinta,
              fontFamily: fonts.semibold,
              fontSize: 17,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/// Botão secundário: contorno, sem preenchimento. Para a ação alternativa ao
/// lado da primária, onde duas cheias competiriam pelo olho.
export function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const { alturaMin } = useScale();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? c.line2 : 'transparent',
          borderWidth: 1.5,
          borderColor: c.line,
          borderRadius: radius.md,
          minHeight: alturaMin(52),
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: c.text2, fontFamily: fonts.semibold, fontSize: 17 }}>{label}</Text>
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
  const { alturaMin } = useScale();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {/* O rótulo era caixa alta de 11 pt com 1,4 de entrelinha: abaixo do
          mínimo de 11 pt do HIG depois do versalete, e o principal tique de
          "template". Agora é 13 pt em sentence case. */}
      <Text
        maxFontSizeMultiplier={TETO_ROTULO}
        style={{
          fontFamily: fonts.semibold,
          fontSize: 13,
          color: c.text2,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: c.surface2,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? c.bad : focused ? c.brandAction : c.line,
          paddingHorizontal: spacing.md,
          minHeight: alturaMin(52),
        }}
      >
        {leading}
        <TextInput
          ref={ref}
          {...props}
          // Sem isto o campo é anunciado como "campo de texto" e nada mais: o
          // rótulo acima é um Text irmão, e o VoiceOver não liga os dois
          // sozinho como o <label> faz na web.
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={error ?? undefined}
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
            // 22 pt de ícone + 11 de folga em cada lado = 44 pt.
            hitSlop={11}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <EyeIcon open={revealed} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* `accessibilityLiveRegion` faz o erro ser anunciado no momento em que
          aparece, em vez de esperar o foco passar por ele. */}
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 13 }}
        >
          {error}
        </Text>
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
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      // A caixa tem 20 pt; a linha inteira precisa de 44 pt de altura para
      // virar alvo válido, então o alvo é a linha, não o quadradinho.
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: MIN_TOQUE,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? c.brandAction : c.line,
          backgroundColor: checked ? c.brandAction : 'transparent',
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


import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { brandGradient, fonts, radius, spacing } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

/// Cabeçalho verde em degradê — o mesmo das telas 02, 03 e 09 do protótipo.
export function BrandHeader({
  title,
  subtitle,
  right,
  onBack,
  children,
  compact,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  children?: ReactNode;
  /// Menos respiro embaixo, para quando um card se sobrepõe ao cabeçalho.
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...brandGradient]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1.4 }}
      style={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: compact ? spacing.xxl + spacing.xl : spacing.xl,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 34,
        }}
      >
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Voltar">
            <Icon name="chevron-left" color="#FFFFFF" size={26} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
        {right ?? <View style={{ width: 26 }} />}
      </View>

      <Text
        style={{
          marginTop: spacing.md,
          color: '#FFFFFF',
          fontFamily: fonts.display,
          fontSize: 28,
          letterSpacing: 0.4,
        }}
      >
        {title.toUpperCase()}
      </Text>
      {subtitle ? (
        <Text
          style={{
            marginTop: 2,
            color: 'rgba(255,255,255,0.82)',
            fontFamily: fonts.regular,
            fontSize: 14,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {children}
    </LinearGradient>
  );
}

/// Casca padrão das telas internas: cabeçalho + conteúdo rolável.
export function Screen({
  title,
  subtitle,
  right,
  headerExtra,
  children,
  compactHeader,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  compactHeader?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader
        title={title}
        subtitle={subtitle}
        right={right}
        compact={compactHeader}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      >
        {headerExtra}
      </BrandHeader>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({
  children,
  style,
  highlighted,
}: {
  children: ReactNode;
  style?: ViewStyle;
  highlighted?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: highlighted ? c.brandLine : c.line,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/// Rótulo em caixa alta com espaçamento largo — o padrão de seção do protótipo.
export function SectionLabel({ children, style }: { children: string; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <Text
      style={[
        {
          color: c.muted,
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 1.4,
        },
        style as never,
      ]}
    >
      {children.toUpperCase()}
    </Text>
  );
}

/// Filtros em pílula (telas 05 e 09).
export function ChipFilters<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { c } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              backgroundColor: active ? c.brand : c.surface,
              borderWidth: 1,
              borderColor: active ? c.brand : c.line,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.lg,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: active ? c.onBrand : c.text2,
                fontFamily: fonts.semibold,
                fontSize: 13,
              }}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/// Abas sublinhadas (tela 07).
export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { c } = useTheme();

  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.line }}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderBottomWidth: 2,
              borderBottomColor: active ? c.brand : 'transparent',
            }}
          >
            <Text
              style={{
                color: active ? c.text : c.muted,
                fontFamily: fonts.semibold,
                fontSize: 13,
              }}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/// Pílula de status: "Em jornada", "Aprovado", "Em análise"…
export function Tag({ text, tone }: { text: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' }) {
  const { c } = useTheme();
  const map = {
    ok: { bg: c.brandSoft, ink: c.brandInk },
    warn: { bg: 'rgba(217,138,0,0.14)', ink: c.warn },
    bad: { bg: 'rgba(214,69,69,0.12)', ink: c.bad },
    neutral: { bg: c.surface2, ink: c.muted },
  }[tone];

  return (
    <View
      style={{
        backgroundColor: map.bg,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: map.ink, fontFamily: fonts.semibold, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

/// Linha de lista com ícone, título, subtítulo e chevron (telas 08 e 11).
export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  iconTone,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  iconTone?: 'brand' | 'warn' | 'bad' | 'neutral';
}) {
  const { c } = useTheme();
  const tone = {
    brand: { bg: c.brandSoft, ink: c.brandInk },
    warn: { bg: 'rgba(217,138,0,0.12)', ink: c.warn },
    bad: { bg: 'rgba(214,69,69,0.10)', ink: c.bad },
    neutral: { bg: c.surface2, ink: c.text2 },
  }[iconTone ?? 'neutral'];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          backgroundColor: tone.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color={tone.ink} size={20} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{title}</Text>
        {subtitle ? (
          <Text
            style={{
              marginTop: 1,
              color: c.muted,
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ?? (onPress ? <Icon name="chevron-right" color={c.muted} size={20} /> : null)}
    </Pressable>
  );
}

/// Interruptor das preferências (telas 08 e 14).
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={{
        width: 46,
        height: 27,
        borderRadius: radius.pill,
        backgroundColor: value ? c.brand : c.line,
        padding: 3,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{ width: 21, height: 21, borderRadius: 11, backgroundColor: c.surface }}
      />
    </Pressable>
  );
}

/// Bloco de número grande + rótulo (resumo do mês e painel do gestor).
export function StatTile({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: 'default' | 'brand' | 'warn' | 'bad';
}) {
  const { c } = useTheme();
  const ink = {
    default: c.text,
    brand: c.brandInk,
    warn: c.warn,
    bad: c.bad,
  }[tone ?? 'default'];

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ color: ink, fontFamily: fonts.display, fontSize: 24 }}>{value}</Text>
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, detail }: { icon: IconName; title: string; detail?: string }) {
  const { c } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm }}>
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: c.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color={c.muted} size={26} />
      </View>
      <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 16 }}>{title}</Text>
      {detail ? (
        <Text
          style={{
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

/// Aviso de dado ainda não vindo do servidor. Deixa explícito na própria tela
/// o que é estrutura pronta esperando backend — melhor que número inventado
/// passando por real.
export function ProvisionalNotice({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        backgroundColor: 'rgba(217,138,0,0.10)',
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'flex-start',
      }}
    >
      <Icon name="alert" color={c.warn} size={18} />
      <Text
        style={{
          flex: 1,
          color: c.warn,
          fontFamily: fonts.medium,
          fontSize: 12,
          lineHeight: 17,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

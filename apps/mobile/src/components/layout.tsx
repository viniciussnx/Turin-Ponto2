import type { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { brandGradient, fonts, radius, spacing, MIN_TOQUE } from '../theme/tokens';
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

      {/* Sem `toUpperCase`: o caixa alta em títulos é o tique de template, e
          em português ele ainda atrapalha a leitura de nomes próprios longos
          como "MARIA APARECIDA DOS SANTOS". `accessibilityRole="header"` dá a
          navegação por cabeçalho no VoiceOver. */}
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={{
          marginTop: spacing.md,
          color: '#FFFFFF',
          fontFamily: fonts.display,
          fontSize: 28,
        }}
      >
        {title}
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

/*
 * Rótulo de seção.
 *
 * Era caixa alta de 11 pt com 1,4 de entrelinha, na cor `muted` — três
 * problemas de uma vez: 11 pt é o piso absoluto do HIG e o versalete o faz
 * parecer menor; `muted` reprovava em contraste; e o versalete espaçado era
 * o tique visual que fazia cada tela do app parecer a mesma tela de template.
 *
 * Agora é 13 pt, peso semibold, sentence case, em `text2`. A hierarquia vem
 * do peso e da cor — que é como o iOS faz.
 */
export function SectionLabel({ children, style }: { children: string; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          color: c.text2,
          fontFamily: fonts.semibold,
          fontSize: 13,
        },
        style as never,
      ]}
    >
      {children}
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
              backgroundColor: active ? c.brandAction : c.surface,
              borderWidth: 1,
              borderColor: active ? c.brandAction : c.line,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.lg,
              // 7 pt de respiro dava uma pílula de ~30 pt de altura. O piso do
              // HIG é 44, e estes filtros ficam lado a lado num carrossel.
              minHeight: MIN_TOQUE,
              justifyContent: 'center',
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
              justifyContent: 'center',
              minHeight: MIN_TOQUE,
              paddingVertical: spacing.md,
              borderBottomWidth: 2,
              borderBottomColor: active ? c.brandAction : 'transparent',
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
  // Os fundos de warn e bad eram rgba() cravados no código e não mudavam no
  // tema escuro — "Aprovado" e "Recusado" ficavam ilegíveis à noite, que são
  // justamente os dois estados que o motorista mais precisa ler. Agora saem
  // dos tokens, que têm valor próprio em cada tema.
  const map = {
    ok: { bg: c.okSoft, ink: c.ok },
    warn: { bg: c.warnSoft, ink: c.warn },
    bad: { bg: c.badSoft, ink: c.bad },
    neutral: { bg: c.surface2, ink: c.text2 },
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

/*
 * Interruptor das preferências.
 *
 * Usa o `Switch` nativo em vez da pílula desenhada à mão. A pílula anterior
 * separava ligado de desligado só pela cor do trilho, e o botão branco sobre
 * o trilho cinza dava 1,24:1 — praticamente invisível. Pior: quem tem
 * deuteranopia (~6% dos homens, e a frota da Turin é majoritariamente
 * masculina) não distinguia verde de cinza.
 *
 * `color.md › Supporting accessibility` é direto: *"Avoid relying solely on
 * color to differentiate between objects, indicate interactivity, or
 * communicate essential information."* O `Switch` do sistema já traz a
 * separação por posição, o contorno, o comportamento de arrastar, o alvo de
 * toque correto e o papel de acessibilidade — e acompanha as preferências de
 * contraste e movimento do aparelho sem código nosso.
 */
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  /// Rótulo acessível. Sem ele o interruptor é anunciado só como "ativado".
  label?: string;
}) {
  const { c } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: c.line, true: c.brandAction }}
      thumbColor={c.surface}
      ios_backgroundColor={c.line}
    />
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
      <Text style={{ color: ink, fontFamily: fonts.mono, fontSize: 24 }}>{value}</Text>
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

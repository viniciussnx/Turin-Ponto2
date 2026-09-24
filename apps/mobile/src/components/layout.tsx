import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { eyebrow, fonts, radius, MIN_TOQUE } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { IconButton } from './ui';

/*
 * Blocos de layout do protótipo "Turin Transports Ponto App" (Claude Design).
 * Medidas em pontos, iguais aos px do protótipo (a moldura dele tem 390 de
 * largura, a mesma de um iPhone).
 */

/// Cabeçalho branco das telas internas: botão voltar de 40 pt (raio 12,
/// borda `--line`) + título `600 17px`; ou, nas abas, só o título `700 18px`.
export function TopBar({
  title,
  onBack,
  right,
  big,
  children,
  border = true,
  fundo,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  /// Título de aba (sem voltar): `font:700 18px; letter-spacing:-.02em`.
  big?: boolean;
  children?: ReactNode;
  border?: boolean;
  fundo?: string;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: fundo ?? c.surface,
        paddingTop: insets.top + 6,
        paddingHorizontal: 18,
        paddingBottom: children ? 16 : 14,
        borderBottomWidth: border ? 1 : 0,
        borderBottomColor: c.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
        {onBack ? <IconButton name="chevron-left" label="Voltar" onPress={onBack} /> : null}
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{
            flex: 1,
            color: c.text,
            fontFamily: big ? fonts.bold : fonts.semibold,
            fontSize: big ? 18 : 17,
            letterSpacing: big ? -0.36 : 0,
          }}
        >
          {title}
        </Text>
        {right}
      </View>
      {children ? <View style={{ marginTop: 12 }}>{children}</View> : null}
    </View>
  );
}

/// Casca padrão: cabeçalho + conteúdo rolável sobre `--bg` + rodapé opcional
/// fixo (`background:var(--surface); border-top:1px solid var(--line)`).
export function Screen({
  title,
  subtitle,
  right,
  headerExtra,
  children,
  footer,
  big,
  onBack,
  semVoltar,
  aba,
  gap = 14,
  headerBorder = true,
}: {
  title: string;
  /// Texto curto à direita do título (ex.: "Semana 37").
  subtitle?: string;
  right?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  big?: boolean;
  onBack?: () => void;
  semVoltar?: boolean;
  /// Tela de aba: reserva a altura da barra de abas no fim do scroll.
  aba?: boolean;
  gap?: number;
  headerBorder?: boolean;
  /// Compatibilidade com as telas antigas; o protótipo não usa.
  compactHeader?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const voltar = semVoltar ? undefined : (onBack ?? (router.canGoBack() ? () => router.back() : undefined));

  const direita =
    right ??
    (subtitle ? (
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13 }}>{subtitle}</Text>
    ) : null);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={title} onBack={voltar} right={direita} big={big} border={headerBorder}>
        {headerExtra}
      </TopBar>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: footer || aba ? 18 : insets.bottom + 24,
          gap,
        }}
      >
        {children}
      </ScrollView>
      {footer ? <Footer>{footer}</Footer> : null}
    </View>
  );
}

/// Rodapé fixo das telas de detalhe (botões de ação).
export function Footer({ children, semBorda }: { children: ReactNode; semBorda?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 14) + 16,
        backgroundColor: semBorda ? 'transparent' : c.surface,
        borderTopWidth: semBorda ? 0 : 1,
        borderTopColor: c.line,
        gap: 9,
      }}
    >
      {children}
    </View>
  );
}

/// Cabeçalho verde sólido (home e perfil): `background:#0BAF29`.
export function BrandHeader({
  title,
  subtitle,
  right,
  onBack,
  children,
  compact,
  fundo,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  children?: ReactNode;
  compact?: boolean;
  fundo?: string;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: fundo ?? c.brand,
        paddingTop: insets.top + 6,
        paddingHorizontal: 22,
        paddingBottom: compact ? 30 : 26,
        overflow: 'hidden',
      }}
    >
      {title || onBack || right ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Voltar">
              <Icon name="chevron-left" color="#FFFFFF" size={24} />
            </Pressable>
          ) : null}
          {title ? (
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              style={{ flex: 1, color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.36 }}
            >
              {title}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {right}
        </View>
      ) : null}
      {subtitle ? (
        <Text
          style={{
            marginTop: 6,
            color: 'rgba(255,255,255,0.82)',
            fontFamily: fonts.regular,
            fontSize: 13,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

/// Cartão: `background:var(--surface); border:1px solid var(--line2);
/// border-radius:18px`.
export function Card({
  children,
  style,
  highlighted,
  sombra,
}: {
  children: ReactNode;
  style?: ViewStyle;
  highlighted?: boolean;
  sombra?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: highlighted ? c.brandLine : c.line2,
          padding: 16,
        },
        sombra
          ? {
              shadowColor: c.shadow,
              shadowOpacity: 0.5,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 10 },
              elevation: 3,
            }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/// Linha divisória entre itens de uma lista dentro de um `Card`.
export function Divider({ tracejada }: { tracejada?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        height: 0,
        borderTopWidth: 1,
        borderTopColor: tracejada ? c.line : c.line2,
        borderStyle: tracejada ? 'dashed' : 'solid',
      }}
    />
  );
}

/// Rótulo de seção em versalete: `font:600 11px; letter-spacing:.16em;
/// text-transform:uppercase; color:var(--muted)`.
export function SectionLabel({
  children,
  style,
  right,
}: {
  children: string;
  style?: ViewStyle;
  right?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 4 },
        style,
      ]}
    >
      <Text accessibilityRole="header" style={eyebrow(c.muted)}>
        {children}
      </Text>
      {right}
    </View>
  );
}

/// Filtros em pílula (gestor): `height:34px; padding:0 13px; border-radius:10px;
/// font:600 12.5px`. Ativo: `--brand` com texto branco.
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: 5, bottom: 5 }}
            style={{
              height: 34,
              paddingHorizontal: 13,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: active ? c.brand : c.line,
              backgroundColor: active ? c.brand : c.surface,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: active ? '#FFFFFF' : c.text2,
                fontFamily: fonts.semibold,
                fontSize: 12.5,
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

/// Abas sublinhadas (solicitações): `gap:20px; font:600 14px;
/// border-bottom:2.5px solid var(--brand)` na ativa.
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              paddingTop: 10,
              paddingBottom: 12,
              minHeight: MIN_TOQUE,
              borderBottomWidth: 2.5,
              borderBottomColor: active ? c.brand : 'transparent',
            }}
          >
            <Text style={{ color: active ? c.text : c.muted, fontFamily: fonts.semibold, fontSize: 14 }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type Tone = 'ok' | 'warn' | 'bad' | 'neutral';

export function useToneColors() {
  const { c } = useTheme();
  return (tone: Tone) =>
    ({
      ok: { bg: c.brandSoft, ink: c.brandInk, line: c.brandLine },
      warn: { bg: c.warnSoft, ink: c.warn, line: c.warnLine },
      bad: { bg: c.badSoft, ink: c.bad, line: 'rgba(214,69,69,0.30)' },
      neutral: { bg: c.surface2, ink: c.muted, line: c.line },
    })[tone];
}

/// Etiqueta de status: `height:26px; padding:0 10px; border-radius:8px;
/// font:600 11px; letter-spacing:.04em`. `caixaAlta` é a variante com borda
/// do histórico de ajustes (tela 15).
export function Tag({
  text,
  tone,
  caixaAlta,
  ponto,
}: {
  text: string;
  tone: Tone;
  caixaAlta?: boolean;
  /// Bolinha à esquerda (ex.: "Em jornada").
  ponto?: boolean;
}) {
  const { c } = useTheme();
  const map = useToneColors()(tone);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: caixaAlta ? 24 : 26,
        paddingHorizontal: caixaAlta ? 9 : 10,
        borderRadius: caixaAlta ? 7 : 8,
        backgroundColor: map.bg,
        borderWidth: caixaAlta || ponto ? 1 : 0,
        borderColor: map.line,
        alignSelf: 'flex-start',
      }}
    >
      {ponto ? (
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone === 'ok' ? c.brand : map.ink }} />
      ) : null}
      <Text
        style={{
          color: map.ink,
          fontFamily: caixaAlta ? fonts.bold : fonts.semibold,
          fontSize: caixaAlta ? 10 : ponto ? 12 : 11,
          letterSpacing: caixaAlta ? 10 * 0.14 : ponto ? 0 : 11 * 0.04,
          textTransform: caixaAlta ? 'uppercase' : 'none',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/// Quadrado de ícone tonalizado (listas de solicitações e notificações).
export function IconChip({
  icon,
  tone = 'neutral',
  size = 36,
  cor,
}: {
  icon: IconName;
  tone?: Tone | 'brand';
  size?: number;
  cor?: string;
}) {
  const { c } = useTheme();
  const tones = useToneColors();
  const map =
    tone === 'brand'
      ? { bg: c.surface2, ink: c.brandInk }
      : tone === 'neutral'
        ? { bg: c.surface2, ink: c.text2 }
        : tones(tone);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.31),
        backgroundColor: map.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} color={cor ?? map.ink} size={Math.round(size * 0.52)} strokeWidth={1.9} />
    </View>
  );
}

/// Linha de lista do perfil: ícone em quadrado de 34 pt, título `600 14px`,
/// subtítulo `400 12px` e chevron.
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

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 15,
        paddingHorizontal: 16,
        backgroundColor: pressed && onPress ? c.surface2 : 'transparent',
      })}
    >
      <IconChip icon={icon} tone={iconTone ?? 'brand'} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: iconTone === 'bad' ? c.bad : c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 1 }}>{subtitle}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" color={c.text} size={18} strokeWidth={1.9} /> : null)}
    </Pressable>
  );
}

/// Interruptor do protótipo: trilho 46×28 raio 16, botão branco de 22 pt com
/// sombra. Ligado: `--brand`; desligado: `--line`.
export function Toggle({
  value,
  onChange,
  label,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const { c } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={{
        width: 46,
        height: 28,
        borderRadius: 16,
        padding: 3,
        flexDirection: 'row',
        justifyContent: value ? 'flex-end' : 'flex-start',
        backgroundColor: value ? c.brand : c.line,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
          shadowOpacity: 0.22,
          shadowRadius: 2.5,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

/// Caixa de número do detalhe do dia: `padding:12px 14px; border-radius:14px;
/// background:var(--surface2)`; rótulo `600 9px .12em`, valor `700 20px`.
/// `tone="brand"` é o saldo positivo (fundo `--brand-soft`, borda `--brand-line`).
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
  const t = tone ?? 'default';
  const fundo = t === 'brand' ? c.brandSoft : t === 'warn' ? c.warnSoft : t === 'bad' ? c.badSoft : c.surface2;
  const borda = t === 'brand' ? c.brandLine : t === 'warn' ? c.warnLine : t === 'bad' ? 'rgba(214,69,69,0.30)' : 'transparent';
  const tinta = t === 'brand' ? c.brandInk : t === 'warn' ? c.warn : t === 'bad' ? c.bad : c.text;

  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.lg,
        backgroundColor: fundo,
        borderWidth: 1,
        borderColor: borda,
      }}
    >
      <Text
        style={{
          ...eyebrow(t === 'default' ? c.muted : tinta, 9),
          letterSpacing: 9 * 0.12,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          marginTop: 2,
          color: tinta,
          fontFamily: fonts.bold,
          fontSize: 20,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function EmptyState({ icon, title, detail }: { icon: IconName; title: string; detail?: string }) {
  const { c } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
      <IconChip icon={icon} size={52} />
      <Text style={{ marginTop: 4, color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{title}</Text>
      {detail ? (
        <Text
          style={{
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

/// Aviso em caixa (tela 06 "Divergência de jornada", tela 17 "Atenção",
/// tela 14 com o sino): `padding:13px 14px; border-radius:15px`.
export function Aviso({
  titulo,
  texto,
  tom = 'warn',
  icon,
}: {
  titulo?: string;
  texto: string;
  tom?: 'warn' | 'brand' | 'bad';
  icon?: IconName;
}) {
  const { c } = useTheme();
  const cores =
    tom === 'brand'
      ? { bg: c.brandSoft, line: c.brandLine, ink: c.text }
      : tom === 'bad'
        ? { bg: c.badSoft, line: 'rgba(214,69,69,0.30)', ink: c.bad }
        : { bg: 'rgba(217,138,0,0.10)', line: c.warnLine, ink: c.warn };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 11,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 15,
        backgroundColor: cores.bg,
        borderWidth: 1,
        borderColor: cores.line,
      }}
    >
      <View style={{ marginTop: 1 }}>
        <Icon name={icon ?? (tom === 'brand' ? 'bell' : 'alert')} color={c.text} size={20} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1 }}>
        {titulo ? (
          <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 13 }}>{titulo}</Text>
        ) : null}
        <Text
          style={{
            marginTop: titulo ? 2 : 0,
            color: tom === 'brand' ? c.text2 : c.text2,
            fontFamily: fonts.regular,
            fontSize: titulo ? 12 : 13,
            lineHeight: titulo ? 17.4 : 19,
          }}
        >
          {texto}
        </Text>
      </View>
    </View>
  );
}

/// Aviso de dado ainda não vindo do servidor.
export function ProvisionalNotice({ children }: { children: string }) {
  return <Aviso titulo="Dados de demonstração" texto={children} tom="warn" />;
}

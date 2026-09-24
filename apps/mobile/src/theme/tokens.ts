/// Tokens de design do "Meu Ponto Turin".
///
/// Espelham, valor a valor, as variáveis do protótipo no Claude Design
/// ("Turin Transports Ponto App", arquivo `design/Meu Ponto Turin.dc.html`):
/// `:root` é o tema claro e `[data-theme="escuro-grafite"]` é o escuro — o
/// mesmo mapeamento que o protótipo faz para "escuro".
///
/// ATENÇÃO — CONTRASTE: o protótipo usa o verde da marca (#0BAF29) como fundo
/// de botão com texto branco. Esse par dá 2,93:1, abaixo do mínimo de 4,5:1 do
/// HIG/WCAG para texto. Foi uma escolha consciente seguir o protótipo à risca;
/// se um dia o contraste precisar ser corrigido, basta trocar `brandAction`
/// por `#08871F` (4,6:1) — todas as telas leem daqui.

export interface Palette {
  /// Verde da marca (`--brand`).
  brand: string;
  /// Fundo de ação (botão primário, chip ativo, aba ativa).
  brandAction: string;
  /// Estado pressionado da ação.
  brandActionPressed: string;
  /// Tinta verde sobre fundo claro (`--brand-ink`).
  brandInk: string;
  brandSoft: string;
  brandLine: string;

  bg: string;
  surface: string;
  surface2: string;
  line: string;
  line2: string;

  text: string;
  text2: string;
  muted: string;

  ok: string;
  okSoft: string;
  warn: string;
  warnSoft: string;
  warnLine: string;
  bad: string;
  badSoft: string;
  info: string;
  infoSoft: string;

  /// Fundo escuro fixo do splash, do painel do gestor e da câmera (`--deep`).
  deep: string;
  shadow: string;
  /// Texto sobre `brandAction`.
  onBrand: string;
}

const BRAND = '#0BAF29';

const light: Palette = {
  brand: BRAND,
  brandAction: BRAND,
  brandActionPressed: '#08871F',
  brandInk: '#08871F',
  brandSoft: 'rgba(11,175,41,0.10)',
  brandLine: 'rgba(11,175,41,0.28)',

  bg: '#F1F4F1',
  surface: '#FFFFFF',
  surface2: '#F7F9F7',
  line: '#E2E8E3',
  line2: '#EDF1ED',

  text: '#0F1F17',
  text2: '#3A4E44',
  muted: '#788B80',

  ok: BRAND,
  okSoft: 'rgba(11,175,41,0.10)',
  warn: '#D98A00',
  warnSoft: 'rgba(217,138,0,0.12)',
  warnLine: 'rgba(217,138,0,0.32)',
  bad: '#D64545',
  badSoft: 'rgba(214,69,69,0.10)',
  info: '#2C6BD6',
  infoSoft: 'rgba(44,107,214,0.10)',

  deep: '#07130D',
  shadow: 'rgba(9,38,24,0.30)',
  onBrand: '#FFFFFF',
};

/// `escuro-grafite` do protótipo.
const dark: Palette = {
  brand: BRAND,
  brandAction: BRAND,
  brandActionPressed: '#08871F',
  brandInk: '#42D867',
  brandSoft: 'rgba(11,175,41,0.18)',
  brandLine: 'rgba(66,216,103,0.40)',

  bg: '#0B120E',
  surface: '#131C17',
  surface2: '#19251E',
  line: '#24372C',
  line2: '#1C2C23',

  text: '#EDF6F0',
  text2: '#B8CEC0',
  muted: '#83A08E',

  ok: '#3FD162',
  okSoft: 'rgba(11,175,41,0.18)',
  warn: '#F2B544',
  warnSoft: 'rgba(242,181,68,0.14)',
  warnLine: 'rgba(242,181,68,0.34)',
  bad: '#F2837C',
  badSoft: 'rgba(242,131,124,0.14)',
  info: '#7FB0F2',
  infoSoft: 'rgba(127,176,242,0.14)',

  deep: '#060D09',
  shadow: 'rgba(0,0,0,0.6)',
  onBrand: '#FFFFFF',
};

export const palettes = { light, dark } as const;
export type ThemeName = keyof typeof palettes;

/// Degradê do login e do splash (`linear-gradient(160deg, …)` no protótipo).
export const brandGradient = ['#0CB82C', '#0A8F22', '#075E17'] as const;
/// Degradê do splash, que termina no verde quase preto.
export const splashGradient = ['#0BAF29', '#07661A', '#041A0B'] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/// Raios usados no protótipo.
export const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 24,
  pill: 999,
} as const;

/// Alvo mínimo de toque: 44×44 pt.
export const MIN_TOQUE = 44;

/// Public Sans, a única família do protótipo, nos pesos que ele usa.
export const fonts = {
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semibold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  extrabold: 'PublicSans_800ExtraBold',
} as const;

/// Rótulo em versalete do protótipo (`font:600 11px; letter-spacing:.16em;
/// text-transform:uppercase`). Em RN, `letterSpacing` é em pontos.
export const eyebrow = (color: string, size = 11) =>
  ({
    color,
    fontFamily: fonts.semibold,
    fontSize: size,
    letterSpacing: size * 0.16,
    textTransform: 'uppercase',
  }) as const;

/// Altura da barra de abas, sem o inset inferior.
export const ALTURA_ABAS = 64;

/// Tokens de design do protótipo "Meu Ponto Turin".
///
/// Copiados literalmente do `:root` e do `[data-theme="escuro"]` do arquivo
/// `design/Meu Ponto Turin.dc.html`. Não invente cor aqui: se o protótipo
/// mudar, atualize este arquivo a partir dele, e a tela inteira acompanha.

export interface Palette {
  brand: string;
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
  warn: string;
  bad: string;
  info: string;

  /// Fundo escuro fixo do splash e dos cabeçalhos em degradê.
  deep: string;
  /// Sombra dos cartões.
  shadow: string;
  /// Cor sobre o verde da marca.
  onBrand: string;
}

const light: Palette = {
  brand: '#0BAF29',
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

  ok: '#0BAF29',
  warn: '#D98A00',
  bad: '#D64545',
  info: '#2C6BD6',

  deep: '#07130D',
  shadow: 'rgba(9,38,24,0.30)',
  onBrand: '#FFFFFF',
};

const dark: Palette = {
  ...light,
  brandSoft: 'rgba(11,175,41,0.16)',
  brandLine: 'rgba(11,175,41,0.40)',

  bg: '#0A1310',
  surface: '#111E18',
  surface2: '#16241D',
  line: '#22342B',
  line2: '#1B2A22',

  text: '#EAF3EE',
  text2: '#BACBC1',
  muted: '#849A90',

  deep: '#050C08',
  shadow: 'rgba(0,0,0,0.55)',
};

export const palettes = { light, dark } as const;
export type ThemeName = keyof typeof palettes;

/// Degradê do splash e do cabeçalho, tal como no protótipo:
/// `radial-gradient(120% 80% at 50% 12%, #0BAF29, #07752b 42%, #04150c)`.
/// Em React Native não há gradiente radial — o linear vertical é a
/// aproximação mais próxima e visualmente indistinguível numa tela de celular.
export const brandGradient = ['#0BAF29', '#07752B', '#04150C'] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/// As famílias correspondem aos pesos carregados em `useAppFonts`.
export const fonts = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  bold: 'Barlow_700Bold',
  /// Barlow Condensed: usada nos títulos em caixa alta do protótipo
  /// ("MEU PONTO TURIN", "BEM-VINDO DE VOLTA", "RICARDO ALVES").
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
} as const;

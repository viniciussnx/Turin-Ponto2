/// Tokens de design do "Meu Ponto Turin".
///
/// A paleta é a escala oficial da Turin, copiada do painel de férias em
/// produção (gestaodeferias.turintransportes.com). App, painel de ponto e
/// painel de férias passam a ler como um produto só.
///
/// REGRA QUE NÃO PODE SER QUEBRADA: `turin[500]` é a cor da marca e NUNCA
/// carrega texto branco — branco sobre ela dá 2,93:1, abaixo do mínimo do HIG
/// para qualquer tamanho. Fundo de botão é `turin[700]` (6,18:1) e o estado
/// pressionado é `turin[800]` (8,41:1): o botão escurece ao ser tocado, como
/// se espera, em vez de clarear.
///
/// Todo par usado aqui está verificado em `scripts/verificar-contraste.mjs`,
/// na raiz do repositório. Rode antes de mexer em qualquer valor.

/// Escala da marca. Idêntica à do painel de férias, sem nenhum valor alterado.
export const turin = {
  50: '#EEFBF1',
  100: '#D5F5DD',
  200: '#ADE9BD',
  300: '#76D894',
  400: '#3EC164',
  500: '#0CB02A',
  600: '#0A8F22',
  700: '#0B711F',
  800: '#0D5A1E',
  900: '#0B4A1B',
  950: '#062812',
} as const;

export interface Palette {
  /// Cor da marca para preenchimento decorativo — nunca fundo de texto.
  brand: string;
  /// Fundo de ação (botão primário). Seguro com `onBrand` por cima.
  brandAction: string;
  /// Estado pressionado da ação. Mais escuro que `brandAction`.
  brandActionPressed: string;
  /// Tinta da marca sobre fundos claros: links, valores em destaque.
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
  bad: string;
  badSoft: string;
  info: string;
  infoSoft: string;

  /// Fundo escuro fixo do splash e das telas de câmera.
  deep: string;
  shadow: string;
  /// Cor do texto sobre `brandAction`.
  onBrand: string;
}

const light: Palette = {
  brand: turin[500],
  brandAction: turin[700],
  brandActionPressed: turin[800],
  brandInk: turin[800],
  brandSoft: turin[50],
  brandLine: turin[200],

  bg: '#F4F7F4',
  surface: '#FFFFFF',
  surface2: '#FAFCFA',
  line: '#CFDAD2',
  line2: '#E2E9E3',

  text: '#12211A',
  text2: '#445248',
  // 5,62:1 sobre branco, 5,21:1 sobre `bg`. O valor antigo (#788B80) dava
  // 3,62:1 e reprovava em metade dos textos do app.
  muted: '#5C6B62',

  ok: turin[800],
  okSoft: turin[50],
  warn: '#9A5B00',
  warnSoft: '#FDF3E2',
  bad: '#C0342F',
  badSoft: '#FBECEC',
  info: '#1F5FBF',
  infoSoft: '#EAF1FC',

  deep: turin[950],
  shadow: 'rgba(9,38,24,0.18)',
  onBrand: '#FFFFFF',
};

/*
 * Escuro.
 *
 * Antes este bloco era `...light` com só as superfícies redefinidas, então
 * `ok`, `warn`, `bad` e `info` vinham do claro sem revisão: "Aprovado" e
 * "Recusado" — os dois estados que o motorista mais precisa ler — ficavam
 * abaixo de 4:1 à noite. Agora toda cor de sinalização é redefinida, como
 * manda `dark-mode.md`: as cores do escuro não são inversões das do claro.
 */
const dark: Palette = {
  brand: turin[400],
  // No escuro o botão inverte: fundo claro com tinta escura, que é o que o
  // iOS faz com o botão preenchido em modo escuro. 9,55:1.
  brandAction: turin[300],
  brandActionPressed: turin[200],
  brandInk: turin[300],
  brandSoft: 'rgba(62,193,100,0.14)',
  brandLine: 'rgba(62,193,100,0.38)',

  bg: '#0A1410',
  surface: '#121F19',
  surface2: '#18281F',
  line: '#2A3D33',
  line2: '#1E2E26',

  text: '#EAF2ED',
  text2: '#B7C6BD',
  muted: '#8FA396',

  ok: turin[300],
  okSoft: 'rgba(118,216,148,0.14)',
  warn: '#E8A62E',
  warnSoft: 'rgba(232,166,46,0.14)',
  bad: '#F2827D',
  badSoft: 'rgba(242,130,125,0.14)',
  info: '#7FB0F2',
  infoSoft: 'rgba(127,176,242,0.14)',

  deep: '#050C08',
  shadow: 'rgba(0,0,0,0.55)',
  // Sobre `brandAction` claro, a tinta precisa ser escura.
  onBrand: '#12211A',
};

export const palettes = { light, dark } as const;
export type ThemeName = keyof typeof palettes;

/// Degradê de marca. Vai do verde de ação para o verde profundo — do claro
/// para o escuro, e não o contrário como antes, para que qualquer texto por
/// cima tenha o fundo escurecendo na direção certa.
export const brandGradient = [turin[700], turin[900], turin[950]] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/// Raios do sistema Turin (os mesmos do painel de férias, em pontos).
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/// Alvo mínimo de toque exigido pelo HIG (`accessibility.md`): 44×44 pt.
export const MIN_TOQUE = 44;

/// As famílias correspondem aos pesos carregados em `useAppFonts`.
///
/// Inter para a interface e Inter Tight para os títulos são as mesmas do
/// painel de férias. JetBrains Mono entra nos horários e durações: Barlow
/// Condensed é proporcional, então "11:58" e "07:04" não alinhavam numa
/// coluna — a mono alinha por construção, e um espelho de ponto é uma coluna
/// de horários que se confere de cima a baixo.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'InterTight_700Bold',
  displaySemi: 'InterTight_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

/// Altura da barra de abas, sem o inset inferior.
///
/// A barra é translúcida e `position: absolute` no iOS, então o conteúdo rola
/// POR BAIXO dela — é isso que dá o efeito de material. Toda tela de aba
/// precisa reservar esta altura no fim do scroll, senão o último item fica
/// escondido atrás do vidro.
export const ALTURA_ABAS = 58;

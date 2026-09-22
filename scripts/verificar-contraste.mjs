// Verificador de contraste WCAG 2.x para a paleta Turin.
// Uso: node contrast.mjs
// Sai com código 1 se qualquer par obrigatório reprovar.

const hex = (h) => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};

const lum = (h) =>
  hex(h)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);

// Composição alfa sobre um fundo, para tokens rgba().
const over = (fg, alpha, bg) => {
  const [a, b] = [hex(fg), hex(bg)];
  return '#' + a.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
};

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// ---------------------------------------------------------------- paleta

const P = {
  // Escala oficial Turin, extraída de gestaodeferias.turintransportes.com
  turin50: '#eefbf1', turin100: '#d5f5dd', turin200: '#ade9bd', turin300: '#76d894',
  turin400: '#3ec164', turin500: '#0cb02a', turin600: '#0a8f22', turin700: '#0b711f',
  turin800: '#0d5a1e', turin900: '#0b4a1b', turin950: '#062812',

  tinta: '#12211a', tinta2: '#445248', tinta3: '#5c6b62',
  papel: '#f4f7f4', linha: '#cfdad2', linha2: '#e2e9e3', surface: '#ffffff',

  warn: '#9a5b00', warnSoft: '#fdf3e2',
  bad: '#c0342f', badSoft: '#fbecec',
  info: '#1f5fbf', infoSoft: '#eaf1fc',
  white: '#ffffff',

  // Escuro (app)
  dBg: '#0a1410', dSurface: '#121f19', dSurface2: '#1a2a22', dLine: '#2a3d33',
  dText: '#eaf2ed', dText2: '#b7c6bd', dMuted: '#8fa396',
  dTurin: '#3ec164', dTurinIn: '#76d894', dWarn: '#e8a62e', dBad: '#f2827d', dInfo: '#7fb0f2',
};

// ------------------------------------------------- pares que precisam passar
// [nome, frente, fundo, mínimo]
const checks = [
  // --- claro: texto sobre superfícies
  ['tinta sobre branco',            P.tinta,  P.surface, 4.5],
  ['tinta sobre papel',             P.tinta,  P.papel,   4.5],
  ['tinta-2 sobre branco',          P.tinta2, P.surface, 4.5],
  ['tinta-2 sobre papel',           P.tinta2, P.papel,   4.5],
  ['tinta-3 sobre branco',          P.tinta3, P.surface, 4.5],
  ['tinta-3 sobre papel',           P.tinta3, P.papel,   4.5],
  ['tinta-3 sobre linha-2',         P.tinta3, P.linha2,  4.5],

  // --- botão primário e marca
  ['branco sobre turin-700 (botão)', P.white, P.turin700, 4.5],
  ['branco sobre turin-800 (hover)', P.white, P.turin800, 4.5],
  ['branco sobre turin-900',         P.white, P.turin900, 4.5],
  ['turin-700 sobre branco (link)',  P.turin700, P.surface, 4.5],
  ['turin-800 sobre turin-50 (tag)', P.turin800, P.turin50, 4.5],
  ['turin-800 sobre turin-100',      P.turin800, P.turin100, 4.5],

  // --- situação (claro)
  ['warn sobre branco',             P.warn, P.surface,  4.5],
  ['warn sobre warn-soft',          P.warn, P.warnSoft, 4.5],
  ['bad sobre branco',              P.bad,  P.surface,  4.5],
  ['bad sobre bad-soft',            P.bad,  P.badSoft,  4.5],
  ['info sobre branco',             P.info, P.surface,  4.5],
  ['info sobre info-soft',          P.info, P.infoSoft, 4.5],
  ['branco sobre bad (botão destrutivo)', P.white, P.bad, 4.5],

  // --- foco (indicador não-textual: 3:1)
  ['anel de foco sobre papel',      P.turin700, P.papel,   3],
  ['anel de foco sobre branco',     P.turin700, P.surface, 3],
  ['borda linha sobre branco',      P.linha, P.surface,    1.4],
  ['borda linha sobre papel',       P.linha, P.papel,      1.3],

  // --- rail escuro do painel
  ['branco sobre turin-950 (rail)', P.white,   P.turin950, 4.5],
  ['turin-300 sobre turin-950',     P.turin300, P.turin950, 4.5],
  ['turin-200 sobre turin-950',     P.turin200, P.turin950, 4.5],

  // --- escuro (app)
  ['texto sobre bg escuro',         P.dText,   P.dBg,      4.5],
  ['texto-2 sobre surface escura',  P.dText2,  P.dSurface, 4.5],
  ['muted escuro sobre surface',    P.dMuted,  P.dSurface, 4.5],
  ['turin escuro sobre bg',         P.dTurin,  P.dBg,      4.5],
  ['turin-ink escuro sobre surface',P.dTurinIn, P.dSurface, 4.5],
  ['warn escuro sobre surface',     P.dWarn,   P.dSurface, 4.5],
  ['bad escuro sobre surface',      P.dBad,    P.dSurface, 4.5],
  ['info escuro sobre surface',     P.dInfo,   P.dSurface, 4.5],
  ['tinta sobre turin-300 (botão escuro)', P.tinta, P.dTurinIn, 4.5],
];

let falhas = 0;
const linhas = checks.map(([nome, fg, bg, min]) => {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) falhas++;
  return `${ok ? '  ok ' : 'FALHA'}  ${r.toFixed(2).padStart(6)}:1  (min ${min})  ${nome}  ${fg} / ${bg}`;
});

console.log(linhas.join('\n'));
console.log(`\n${checks.length - falhas}/${checks.length} pares aprovados.`);
if (falhas) {
  console.error(`\n${falhas} par(es) REPROVARAM.`);
  process.exit(1);
}

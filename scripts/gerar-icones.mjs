/*
 * Gera os ícones do app "Meu Ponto Turin".
 *
 * Substitui o placeholder do template do Expo (um chevron azul COM as linhas
 * de construção impressas na arte, que estava indo para a loja).
 *
 * A marca da Turin é um logotipo vazado — "TURIN" em letras de contorno, com
 * uma linha horizontal longa entrando nelas. Logotipo não vira ícone:
 * `app-icons.md` pede um símbolo e desaconselha texto, que some a 40 px.
 *
 * O símbolo é um mostrador. O elo com a marca é o verde da escala Turin e o
 * peso do traço. Ver o comentário de `simbolo()` para as duas tentativas que
 * foram descartadas e por quê.
 *
 * NOTA HONESTA DE ESCOPO: a forma é conservadora. Ela é legível, correta em
 * todos os tamanhos e variantes, e resolve o problema real (o app ia para a
 * loja com o placeholder do Expo). Mas um mostrador é um ícone de catálogo —
 * o que daria personalidade de verdade é direção de arte sobre a marca, e
 * isso é trabalho de designer, não de gerador.
 *
 * Uso: node scripts/gerar-icones.mjs
 */

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'apps', 'mobile', 'assets');

// Escala oficial Turin.
const T = {
  500: '#0CB02A',
  600: '#0A8F22',
  700: '#0B711F',
  800: '#0D5A1E',
  900: '#0B4A1B',
  950: '#062812',
};

/*
 * Mostrador + ponteiros.
 *
 * Duas decisões que custaram uma tentativa descartada:
 *
 * 1. A primeira versão trazia a linha horizontal da marca entrando pela
 *    esquerda, solta ao lado do mostrador. Lida a 40 px, círculo + haste
 *    lateral vira LUPA, não relógio. A linha saiu.
 *
 * 2. Os ponteiros estavam em 10:10 — as duas diagonais simétricas para cima
 *    desenham um "V", que lê como visto de confirmação. Agora são
 *    assimétricos e de comprimentos claramente diferentes: o curto para cima
 *    (12) e o longo para as 4. Não há leitura ambígua possível.
 *
 * O elo com a marca fica no verde da escala Turin e no peso do traço, que é
 * o mesmo peso óptico do logotipo vazado. Um traço duplo concêntrico seria
 * mais fiel ao logotipo, mas a 40 px cada linha teria 0,7 px e sumiria —
 * `app-icons.md` pede legibilidade no menor tamanho antes de fidelidade.
 */
function simbolo(tinta) {
  const cx = 512;
  const cy = 512;
  const r = 268;
  const traco = 62;

  // Ponteiro das horas: para cima, curto e grosso.
  const horasFim = { x: cx, y: cy - 132 };
  // Ponteiro dos minutos: 4 horas (120°), longo e um pouco mais fino, com uma
  // cauda curta do lado oposto — o contrapeso de um ponteiro de verdade. É um
  // detalhe pequeno, mas é o que separa "relógio desenhado" de "relógio de
  // banco de ícones", e sobrevive à redução para 40 px.
  const ang = (120 * Math.PI) / 180;
  const sin = Math.sin(ang);
  const cos = Math.cos(ang);
  const minFim = { x: cx + sin * 186, y: cy - cos * 186 };
  const minCauda = { x: cx - sin * 54, y: cy + cos * 54 };

  return `
    <g fill="none" stroke="${tinta}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${traco}" />
      <line x1="${cx}" y1="${cy}" x2="${horasFim.x}" y2="${horasFim.y}" stroke-width="${traco - 4}" />
      <line x1="${minCauda.x.toFixed(1)}" y1="${minCauda.y.toFixed(1)}"
            x2="${minFim.x.toFixed(1)}" y2="${minFim.y.toFixed(1)}" stroke-width="${traco - 16}" />
    </g>`;
}

/// Ícone cheio, com fundo. `full` = sangria total (iOS mascara sozinho).
function svgCheio({ de, para, tinta }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${de}" />
        <stop offset="1" stop-color="${para}" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#fundo)" />
    ${simbolo(tinta)}
  </svg>`;
}

/*
 * Primeiro plano do adaptive icon do Android.
 *
 * O sistema recorta em círculo, quadrado arredondado ou gota conforme o
 * fabricante, e só garante o círculo central de 66%. Então o símbolo é
 * reduzido para ~62% e centralizado, com o resto transparente.
 */
function svgPrimeiroPlano(tinta) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <g transform="translate(512 512) scale(0.62) translate(-512 -512)">
      ${simbolo(tinta)}
    </g>
  </svg>`;
}

const saidas = [
  // iOS claro — o verde escuro da escala, não o verde-limão: o símbolo branco
  // precisa de contraste, e a marca continua reconhecível.
  {
    arquivo: 'icon.png',
    svg: svgCheio({ de: T[700], para: T[900], tinta: '#FFFFFF' }),
    tamanho: 1024,
  },
  // iOS escuro — mais fundo ainda, símbolo em verde claro em vez de branco
  // puro, que a 100% de branco brilha demais no escuro.
  {
    arquivo: 'icon-dark.png',
    svg: svgCheio({ de: T[900], para: T[950], tinta: '#76D894' }),
    tamanho: 1024,
  },
  // iOS tinted — o sistema aplica a cor; entregamos só a forma em cinza.
  {
    arquivo: 'icon-tinted.png',
    svg: svgCheio({ de: '#1A1A1A', para: '#000000', tinta: '#D8D8D8' }),
    tamanho: 1024,
  },
  // Android adaptive: primeiro plano transparente sobre `backgroundColor`.
  { arquivo: 'android-icon-foreground.png', svg: svgPrimeiroPlano('#FFFFFF'), tamanho: 1024 },
  // Android monocromático (tema dinâmico): só a silhueta.
  { arquivo: 'android-icon-monochrome.png', svg: svgPrimeiroPlano('#FFFFFF'), tamanho: 1024 },
  // Splash: símbolo sozinho, transparente, sobre o `backgroundColor` do splash.
  { arquivo: 'splash-icon.png', svg: svgPrimeiroPlano('#FFFFFF'), tamanho: 1024 },
  // Favicon do bundle web.
  {
    arquivo: 'favicon.png',
    svg: svgCheio({ de: T[700], para: T[900], tinta: '#FFFFFF' }),
    tamanho: 96,
  },
];

await mkdir(destino, { recursive: true });

for (const { arquivo, svg, tamanho } of saidas) {
  await sharp(Buffer.from(svg))
    .resize(tamanho, tamanho)
    .png()
    .toFile(join(destino, arquivo));
  console.log(`  ${arquivo}  ${tamanho}×${tamanho}`);
}

console.log(`\n${saidas.length} arquivos gerados em apps/mobile/assets/`);

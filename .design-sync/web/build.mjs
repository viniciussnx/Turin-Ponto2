// Build web dos componentes reais do app (apps/mobile) para o Claude Design.
//
//   node .design-sync/web/build.mjs      (da raiz do repositório)
//
// Saída: .design-sync/web/dist/index.mjs (ESM, react/react-dom externos) e
// .design-sync/web/dist/index.d.ts + dist/types/ (tsc). O conversor do
// design-sync lê esse dist como se fosse o de um pacote publicado.
//
// Único desvio do código do app: os módulos só-nativos viram stubs sem efeito
// visual (vibração, roteador, seletor nativo de data), e `ThemeContext` ganha um
// `export` para o TurinProvider fixar o tema. Nada de aparência é reescrito.

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const DIST = join(HERE, 'dist');
const require = createRequire(join(ROOT, '.ds-sync', 'package.json'));
const { build } = require('esbuild');

const RNW = join(HERE, 'node_modules', 'react-native-web');
const THEME_PROVIDER = resolve(ROOT, 'apps/mobile/src/theme/ThemeProvider.tsx');

// Módulos nativos sem equivalente visual na web.
const STUBS = {
  'expo-haptics': `
    export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' };
    export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
    export async function impactAsync() {}
    export async function notificationAsync() {}
    export async function selectionAsync() {}`,
  'expo-router': `
    const router = { canGoBack: () => false, back() {}, push() {}, replace() {}, navigate() {}, dismiss() {} };
    export function useRouter() { return router; }
    export function useLocalSearchParams() { return {}; }`,
  '@react-native-community/datetimepicker': `
    export default function DateTimePicker() { return null; }`,
};

const plugin = {
  name: 'turin-web',
  setup(b) {
    b.onResolve({ filter: /^react-native$/ }, () => ({ path: join(RNW, 'dist', 'index.js') }));
    b.onResolve({ filter: /^react-native\/.*/ }, (a) => ({ path: a.path, namespace: 'rn-internal' }));
    b.onLoad({ filter: /.*/, namespace: 'rn-internal' }, (a) => ({
      contents: `throw new Error(${JSON.stringify('import não suportado na web: ' + a.path)});`,
    }));
    const stubRx = new RegExp(`^(${Object.keys(STUBS).map((s) => s.replace(/[/.]/g, '\\$&')).join('|')})$`);
    b.onResolve({ filter: stubRx }, (a) => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({ contents: STUBS[a.path], loader: 'js' }));
    // Expõe o contexto do tema (só acrescenta o export).
    b.onLoad({ filter: /ThemeProvider\.tsx$/ }, (a) => {
      if (resolve(a.path) !== THEME_PROVIDER) return undefined;
      return { contents: readFileSync(a.path, 'utf8') + '\nexport { ThemeContext };\n', loader: 'tsx' };
    });
    // Switch do RNW: no iOS/Android o `thumbColor` vale ligado e desligado; o
    // RNW usa um verde-azulado (#009688) quando ligado. Alinha com o nativo.
    b.onLoad({ filter: /react-native-web[\\/]dist[\\/]exports[\\/]Switch[\\/]index\.js$/ }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      const out = src.replace(
        'activeThumbColor : defaultActiveThumbColor',
        'activeThumbColor : thumbColor != null ? thumbColor : defaultActiveThumbColor',
      );
      if (out === src) throw new Error('patch do Switch do RNW não encontrou o trecho — versão mudou?');
      return { contents: out, loader: 'js' };
    });
    // require('../../assets/x.webp') vira { uri: dataURL }, como o Metro entrega.
    b.onLoad({ filter: /\.(png|webp|jpe?g)$/ }, (a) => {
      const ext = a.path.split('.').pop().replace('jpg', 'jpeg');
      const b64 = readFileSync(a.path).toString('base64');
      return { contents: `module.exports = { uri: "data:image/${ext};base64,${b64}" };`, loader: 'js' };
    });
  },
};

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

await build({
  entryPoints: [join(HERE, 'src', 'index.ts')],
  outfile: join(DIST, 'index.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.jsx', '.mjs', '.json'],
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser', 'import', 'default'],
  nodePaths: [join(HERE, 'node_modules'), join(ROOT, 'node_modules')],
  plugins: [plugin],
  define: {
    __DEV__: 'false',
    'process.env.NODE_ENV': '"production"',
    'process.env.EXPO_OS': '"web"',
    global: 'globalThis',
  },
  logLevel: 'warning',
});
console.log('✓ dist/index.mjs', (statSync(join(DIST, 'index.mjs')).size / 1024).toFixed(0), 'KB');

// Tipos: tsc sobre o entry, depois achata o caminho para dist/types/.
const TYPES_TMP = join(DIST, '.types-tmp');
const tsc = require.resolve('typescript/bin/tsc', { paths: [join(ROOT, 'apps/mobile')] });
try {
  execFileSync(process.execPath, [tsc,
    join(HERE, 'src', 'index.ts'),
    '--ignoreConfig', '--declaration', '--emitDeclarationOnly', '--skipLibCheck', '--jsx', 'react-jsx',
    '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2020',
    '--strict', '--esModuleInterop',
    '--rootDir', ROOT, '--outDir', TYPES_TMP,
    '--types', 'react',
  ], { stdio: 'pipe', cwd: join(ROOT, 'apps/mobile') });
} catch (e) {
  // Erros de tipo do app não bloqueiam a emissão das declarações.
  const out = String(e.stdout ?? '') + String(e.stderr ?? '');
  const n = (out.match(/error TS/g) ?? []).length;
  console.log(`  (tsc: ${n} aviso(s) de tipo — declarações emitidas mesmo assim)`);
  if (process.env.VERBOSE) console.log(out);
}
const entryTypes = join(TYPES_TMP, '.design-sync', 'web', 'src');
if (!existsSync(join(entryTypes, 'index.d.ts'))) throw new Error('tsc não emitiu index.d.ts');
const TYPES = join(DIST, 'types');
cpSync(join(TYPES_TMP, 'apps'), join(TYPES, 'apps'), { recursive: true });
mkdirSync(join(TYPES, 'entry'), { recursive: true });
for (const f of readdirSync(entryTypes)) {
  const txt = readFileSync(join(entryTypes, f), 'utf8').replaceAll('../../../apps/', '../apps/');
  writeFileSync(join(TYPES, 'entry', f), txt);
}
rmSync(TYPES_TMP, { recursive: true, force: true });
writeFileSync(join(DIST, 'index.d.ts'), "export * from './types/entry/index';\n");
console.log('✓ dist/index.d.ts →', relative(ROOT, TYPES));

# Notas do design-sync — Meu Ponto Turin

Projeto Claude Design: https://claude.ai/design/p/885eeac5-2adc-499e-a898-82306ab73780

## Como funciona

- O design system é o **app mobile** (`apps/mobile`, React Native/Expo, Android e iOS). O Claude Design renderiza no navegador, então `.design-sync/web/` é um pacote auxiliar (`@turin/mobile-ds`) que reexporta os componentes REAIS de `apps/mobile/src/components` + tema/tokens e os compila com `react-native-web`.
- Build: `node .design-sync/web/build.mjs` (é o `cfg.buildCmd`), depois o conversor com `--node-modules ./node_modules` (raiz do monorepo). O `entry` já está na config.
- `react-native-web@0.21.2` fica em `.design-sync/web/node_modules` (instalação isolada; não entra no lockfile do repo). Em clone novo: `cd .design-sync/web && npm i --workspaces=false --ignore-scripts`.
- Tipos: `tsc` (TypeScript 6 de `apps/mobile`) exige `--ignoreConfig` quando recebe arquivos na linha de comando.

## Desvios do código do app (todos no build web, nenhum no app)

- Stubs sem efeito visual: `expo-haptics` (vibração), `expo-router` (`useRouter().canGoBack()` = false → `Screen` não mostra voltar), `@react-native-community/datetimepicker` (o seletor nativo não abre; o campo fechado renderiza igual).
- `ThemeProvider.tsx` ganha só `export { ThemeContext }` no build, para `TurinProvider tema="claro|escuro"` fixar a paleta. `tema="sistema"` usa o `ThemeProvider` real.
- `Switch` do RNW: no nativo o `thumbColor` vale ligado e desligado; o RNW pintava o polegar ligado de `#009688` (verde-azulado). O build aplica um patch para usar `thumbColor` também quando ligado. Se a versão do RNW mudar e o trecho não existir, o build falha de propósito.
- Imagens `require('*.webp|png')` viram `{ uri: dataURL }`.

## Decisões

- Categorias sem acento (`botoes`, `formularios`, `navegacao`, `marca-e-icones`…): o conversor transforma a categoria em slug e perdia os acentos (`Ações` → `a-es`).
- Todas as prévias usam largura de celular (342–390 pt) → `cardMode: column` em todos os cartões (senão `[GRID_OVERFLOW]`).
- Primitivas RN (`View`, `Text`, …), `LinearGradient`, `SafeAreaView`, `ThemeProvider` e `TurinProvider` são exportadas no bundle, mas excluídas dos cartões via `componentSrcMap: null`.
- `.d.ts` escritos à mão em `dtsPropsFor` para: `Field` (o `TextInput` herdado tinha ~100 props), `ChipFilters`/`UnderlineTabs` (genérico `T`), `Icon`/`ListRow`/`EmptyState`/`PermissionPrimer` (a união de nomes de ícone vinha truncada) e os que tinham `style?: ViewStyle` sem resolver.
- Datas das prévias fixas em setembro/2026 e conferidas contra o calendário (18/09/2026 = sexta).

## Known render warns

- Nenhum no momento (validate limpo, 24/24).

## Re-sync risks

- `dtsPropsFor` duplica as props de 11 componentes: se as props mudarem no app, atualize a config (a união de ícones fica em `dtsPropsFor.Icon/ListRow/EmptyState/PermissionPrimer`).
- As docs em `.design-sync/docs/*.md` resumem os comentários do código: se um componente mudar de comportamento, revise a doc.
- O patch do `Switch` depende do texto exato do RNW 0.21.2.
- Um componente novo exportado em `apps/mobile/src/components` só entra se for adicionado em `.design-sync/web/src/index.ts`.
- O playwright do conversor está fixado em 1.62.0 porque o chromium em cache é o build 1234.

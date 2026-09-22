# Meu Ponto Turin — convenções para montar telas

App de ponto da Turin Transportes para **Android e iOS** (React Native/Expo). Aqui os componentes são os mesmos do app, rodando via react-native-web. Monte telas como o app faz: **tamanho de celular (390×844), primitivas React Native e tokens em JS**. O sistema não usa classes CSS nem variáveis `var(--*)`.

## Raiz obrigatória

Envolva tudo em `TurinProvider`. Sem ele, `useTheme()` lança erro e nada renderiza.

```tsx
const { TurinProvider, Screen, Card, StatTile, View } = window.TurinPonto;
<TurinProvider tema="claro">            {/* "claro" | "escuro" | "sistema" */}
  <View style={{ width: 390, height: 844 }}>
    <Screen title="Espelho de ponto" subtitle="Setembro de 2026">…</Screen>
  </View>
</TurinProvider>
```

`insetTopo`/`insetBase` simulam a barra de status e o indicador de início (ex.: 47 e 34 no iPhone).

## Estilo = objetos de estilo RN + tokens

Use `View`, `Text`, `ScrollView`, `Pressable`, `Image`, `TextInput`, `StyleSheet`, `LinearGradient` e `useSafeAreaInsets`, todos exportados pelo bundle. Não use `<div>`/`<span>`. O layout é flexbox em coluna por padrão, e `gap` funciona.

- **Cores**: `const { c } = useTheme()` dentro do provider. Fora dele, use `palettes.light` / `palettes.dark`.
  - Superfícies: `bg`, `surface`, `surface2`, `line`, `line2`.
  - Texto: `text`, `text2`, `muted`.
  - Marca: `brandAction` (fundo de botão), `brandActionPressed`, `brandInk` (texto/link verde), `brandSoft`, `brandLine`, `onBrand` (texto sobre `brandAction`).
  - Estado: `ok`/`okSoft`, `warn`/`warnSoft`, `bad`/`badSoft`, `info`/`infoSoft`, e `deep`.
  - Escala crua: `turin[50…950]`.
- **Regra de contraste**: `turin[500]` (`c.brand`) NUNCA leva texto branco. Fundo de ação é `c.brandAction`.
- **Espaço**: `spacing.xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32`. **Raios**: `radius.sm 8 · md 12 · lg 16 · xl 22 · pill 999`. Alvo mínimo de toque: `MIN_TOQUE` (44).
- **Tipografia**: `fontFamily: fonts.X`, nunca pesos soltos.
  - `fonts.regular` / `fonts.medium` / `fonts.semibold` / `fonts.bold`: Inter, para a interface.
  - `fonts.display` / `fonts.displaySemi`: Inter Tight, para títulos.
  - `fonts.mono` / `fonts.monoBold`: JetBrains Mono, para **todo horário e duração** ("07:04", "+04:12").
  - Sentence case sempre. Nada de caixa alta em rótulos.
- **Degradê da marca**: `<LinearGradient colors={[...brandGradient]} …>`. É o do `BrandHeader` e do login.

## Composição típica

- Tela interna: `Screen` (cabeçalho em degradê + scroll) com filhos em `<View style={{ gap: spacing.lg }}>`.
- Tela de aba: `BrandHeader compact` + conteúdo com `marginTop: -spacing.xxl`, para o primeiro `Card` sobrepor o cabeçalho.
- Listas: `Card style={{ paddingVertical: spacing.xs }}` com `ListRow`, separados por `<View style={{ height: 1, backgroundColor: c.line2 }} />`.
- Números: 2–3 `StatTile` numa `View` com `flexDirection: 'row'` dentro de um `Card`.
- Status: `Tag` com tom `ok` | `warn` | `bad` | `neutral`. Dado de demonstração: `ProvisionalNotice` no topo.
- Uma única `PrimaryButton` por tela. A alternativa vai em `SecondaryButton`.
- Ícones: `Icon name=… color={c.muted}`. Os nomes estão em `Icon.d.ts`.

```tsx
function Espelho() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader title="Espelho de ponto" subtitle="Setembro de 2026" compact />
      <ScrollView style={{ marginTop: -spacing.xxl }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <Card><View style={{ flexDirection: 'row' }}>
          <StatTile value="136:24" label="Trabalhado" />
          <StatTile value="+04:12" label="Saldo" tone="brand" />
          <StatTile value="2" label="Pendências" tone="warn" />
        </View></Card>
        <ChipFilters options={['Todos', 'Pendências', 'Extras']} value="Todos" onChange={() => {}} />
        <SectionLabel>Dias</SectionLabel>
        <Card><ReguaDia marcacoes={['05:40', '09:58', '11:02', '14:20']} /></Card>
      </ScrollView>
    </View>
  );
}
```

Antes de estilizar, leia `components/<grupo>/<Nome>/<Nome>.prompt.md` e `.d.ts`: eles trazem as regras de cada peça. Textos em português do Brasil.

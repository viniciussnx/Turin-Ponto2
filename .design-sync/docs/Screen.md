---
category: layout
---
Casca padrão das telas internas: `BrandHeader` em degradê + conteúdo rolável com padding `spacing.lg` sobre fundo `bg`. Ocupa a altura do pai (`flex: 1`) — dê altura ao contêiner (ex.: `height: 844` para um iPhone). O botão voltar aparece quando há histórico de navegação.

```tsx
<View style={{ height: 844 }}>
  <Screen title="Minha escala" subtitle="Escala 6x1 · Garagem Centro">
    <View style={{ gap: spacing.lg }}>{/* Card, SectionLabel, ListRow… */}</View>
  </Screen>
</View>
```

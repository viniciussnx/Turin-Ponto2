---
category: layout
---
Superfície base: fundo `surface`, borda 1 pt `line`, raio `radius.lg` (16), padding `spacing.lg`. `highlighted` troca a borda por `brandLine` (item ativo, pendência). `style` ajusta padding/layout (ex.: `paddingVertical: spacing.xs` para uma lista de `ListRow`).

```tsx
<Card>
  <View style={{ flexDirection: 'row' }}>
    <StatTile value="168:40" label="Trabalhado" />
    <StatTile value="+04:12" label="Saldo" tone="brand" />
  </View>
</Card>
```

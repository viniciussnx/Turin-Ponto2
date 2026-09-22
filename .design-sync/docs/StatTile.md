---
category: dados
---
Número grande (JetBrains Mono 24) + rótulo `muted` 12, centralizado e `flex: 1` — coloque 2–3 lado a lado numa `View` em linha dentro de um `Card`. `tone`: default | brand (saldo positivo) | warn (pendências) | bad (saldo negativo, ausentes).

```tsx
<Card><View style={{ flexDirection: 'row' }}>
  <StatTile value="12" label="Presentes" tone="brand" />
  <StatTile value="2" label="Atrasos" tone="warn" />
  <StatTile value="1" label="Ausentes" tone="bad" />
</View></Card>
```

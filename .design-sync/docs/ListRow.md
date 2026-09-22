---
category: navegacao
---
Linha de lista: ícone num quadrado 38 pt tonalizado (`iconTone`: brand | warn | bad | neutral), título Inter SemiBold 15, subtítulo `muted` 13 e chevron à direita quando há `onPress`. `right` substitui o chevron. Agrupe dentro de um `Card style={{ paddingVertical: spacing.xs }}` separando com uma linha de 1 pt `line2`.

```tsx
<Card style={{ paddingVertical: spacing.xs }}>
  <ListRow icon="mirror" iconTone="brand" title="Minha escala" subtitle="Turno, linha e veículo da semana" onPress={abrir} />
  <View style={{ height: 1, backgroundColor: c.line2 }} />
  <ListRow icon="logout" iconTone="bad" title="Sair" onPress={sair} right={<View />} />
</Card>
```

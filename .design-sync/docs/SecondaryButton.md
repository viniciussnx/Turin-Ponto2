---
category: botoes
---
Botão secundário: contorno `line` de 1,5 pt, sem preenchimento, texto `text2`. Para a ação alternativa ao lado da primária (ex.: "Agora não" abaixo de "Permitir").

```tsx
<View style={{ gap: spacing.sm }}>
  <PrimaryButton label="Permitir" onPress={permitir} />
  <SecondaryButton label="Agora não" onPress={pular} />
</View>
```

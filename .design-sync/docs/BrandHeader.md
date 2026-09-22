---
category: layout
---
Cabeçalho verde em degradê (`brandGradient`: turin-700 → 900 → 950) com título Inter Tight Bold 28 branco e subtítulo branco 82%. `right` recebe uma ação (ex.: ícone `plus` ou `bell`), `onBack` mostra o chevron de voltar, `children` entra abaixo do título. `compact` aumenta o respiro inferior para um `Card` se sobrepor ao cabeçalho (use `marginTop: -spacing.xxl` no conteúdo abaixo).

```tsx
<BrandHeader title="Solicitações" subtitle="Ajustes, abonos e justificativas"
  right={<Icon name="plus" color="#FFFFFF" size={26} />} />
```

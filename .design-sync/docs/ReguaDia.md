---
category: dados
---
Régua de 24 h de um dia: cada par de marcações `HH:MM` vira uma barra `brandAction` na proporção do dia; número ímpar de marcações = jornada em aberto (último trecho curto em `warn`). A faixa 4h–22h (operação) fica mais escura. `altura` padrão 8 (10 no detalhe do dia). Ocupa a largura do pai.

```tsx
<ReguaDia marcacoes={['05:40', '09:58', '11:02', '14:20']} />
<ReguaDia marcacoes={['06:02', '10:30', '11:30']} altura={10} />
<EixoRegua />
```

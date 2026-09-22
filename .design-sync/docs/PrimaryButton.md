---
category: botoes
---
Botão principal do app: fundo `brandAction` (turin-700), texto `onBrand`, 52 pt de altura mínima, raio `radius.md`, Inter SemiBold 17. Pressionado escurece (turin-800). `destrutivo` troca o fundo para `bad` (sair, cancelar pedido). `loading` mostra um spinner; `disabled`/`loading` deixam o fundo `muted`.

Regras: uma ação primária por tela; rótulo em sentence case ("Registrar entrada", "Solicitar ajuste"). Nunca use o verde da marca (`turin[500]`) como fundo de texto.

```tsx
<PrimaryButton label="Registrar entrada" onPress={registrar} />
<PrimaryButton label="Sair" destrutivo onPress={sair} />
```

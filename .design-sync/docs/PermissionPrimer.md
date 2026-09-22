---
category: feedback
---
Preparo antes de um pedido de permissão do sistema (localização, câmera): ícone em quadrado `brandSoft`, título Inter Tight 22, o porquê em uma frase, `PrimaryButton` "Permitir" e `SecondaryButton` para pular. `negada` troca a ação por "Abrir os Ajustes" e explica que o sistema só pergunta uma vez.

```tsx
<PermissionPrimer icone="pin" titulo="Confirmar que você está na garagem"
  porque="No momento da marcação o app lê a posição do aparelho uma única vez."
  aoPermitir={permitir} aoPular={pular} />
```

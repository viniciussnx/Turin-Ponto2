---
category: formularios
---
Campo de data (`modo="date"`) ou hora (`modo="time"`) que abre o seletor NATIVO do sistema ao toque (iOS inline, Android diálogo). Mostra o valor formatado em pt-BR; hora em JetBrains Mono. No Claude Design o seletor nativo não abre — o campo fechado é o que importa para o layout.

```tsx
<DateTimeField label="Dia de referência" modo="date" valor={quando} onChange={setQuando} maximo={hoje} />
<DateTimeField label="Horário correto" modo="time" valor={horario} onChange={setHorario} />
```

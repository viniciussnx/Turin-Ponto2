---
category: formularios
---
Interruptor das preferências — é o `Switch` nativo do sistema (trilho `line`/`brandAction`, botão `surface`). Sempre passe `label` para acessibilidade. Use à direita de uma linha de preferência dentro de um `Card`.

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
  <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>Tema escuro</Text>
  <Toggle value={escuro} onChange={setEscuro} label="Tema escuro" />
</View>
```

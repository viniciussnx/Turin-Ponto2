---
category: formularios
---
Campo de texto rotulado (rótulo 13 pt `text2` acima, caixa `surface2` com borda `line` que vira `brandAction` no foco e `bad` com erro). Aceita as props do `TextInput` do React Native (`value`, `onChangeText`, `placeholder`, `keyboardType`…). `leading` recebe um ícone à esquerda (`PersonIcon`, `LockIcon`); `secure` mascara e adiciona o olho de revelar; `error` mostra a mensagem em `bad` abaixo.

```tsx
<Field label="Matrícula" placeholder="04182" keyboardType="number-pad"
  leading={<PersonIcon color={c.muted} />} value={matricula} onChangeText={setMatricula} />
<Field label="Senha" secure leading={<LockIcon color={c.muted} />} error="Matrícula ou senha incorretas." />
```

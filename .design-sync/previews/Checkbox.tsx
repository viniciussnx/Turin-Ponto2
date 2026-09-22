import { useState } from 'react';
import { Checkbox, Pressable, Text, View, fonts, palettes } from '@turin/mobile-ds';

const c = palettes.light;

export const Marcado = () => {
  const [v, setV] = useState(true);
  return <Checkbox checked={v} onChange={setV} label="Manter conectado" />;
};

export const Desmarcado = () => {
  const [v, setV] = useState(false);
  return <Checkbox checked={v} onChange={setV} label="Manter conectado" />;
};

// Linha do login: caixa à esquerda, "Esqueci a senha" à direita.
export const LinhaDoLogin = () => {
  const [v, setV] = useState(true);
  return (
    <View
      style={{ width: 342, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <Checkbox checked={v} onChange={setV} label="Manter conectado" />
      <Pressable>
        <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 14 }}>
          Esqueci a senha
        </Text>
      </Pressable>
    </View>
  );
};

import { useState } from 'react';
import { Card, SectionLabel, Text, Toggle, View, fonts, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;

export const Ligado = () => {
  const [v, setV] = useState(true);
  return <Toggle value={v} onChange={setV} label="Tema escuro" />;
};

export const Desligado = () => {
  const [v, setV] = useState(false);
  return <Toggle value={v} onChange={setV} label="Tema escuro" />;
};

function Linha({ titulo, dica, inicial }: { titulo: string; dica?: string; inicial: boolean }) {
  const [v, setV] = useState(inicial);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{titulo}</Text>
        {dica ? (
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 13 }}>{dica}</Text>
        ) : null}
      </View>
      <Toggle value={v} onChange={setV} label={titulo} />
    </View>
  );
}

// Card de preferências do Perfil.
export const Preferencias = () => (
  <View style={{ width: 358 }}>
    <Card style={{ gap: spacing.md }}>
      <SectionLabel>Preferências</SectionLabel>
      <Linha titulo="Tema escuro" dica="Desligado segue o sistema" inicial={false} />
      <Linha titulo="Entrar com biometria" inicial />
    </Card>
  </View>
);

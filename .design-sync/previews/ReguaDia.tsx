import { EixoRegua, ReguaDia, Text, View, fonts, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;

function Rotulo({ children }: { children: string }) {
  return (
    <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12, marginBottom: 4 }}>
      {children}
    </Text>
  );
}

// Formas de dia diferentes com a mesma duração.
export const Jornadas = () => (
  <View style={{ width: 326, gap: spacing.md }}>
    <View>
      <Rotulo>Manhã · 05:40–14:20</Rotulo>
      <ReguaDia marcacoes={['05:40', '09:58', '11:02', '14:20']} />
    </View>
    <View>
      <Rotulo>Tarde · 12:00–20:20</Rotulo>
      <ReguaDia marcacoes={['12:00', '16:05', '17:05', '20:20']} />
    </View>
  </View>
);

// Número ímpar de marcações: jornada em aberto (trecho final em warn).
export const EmAberto = () => (
  <View style={{ width: 326 }}>
    <Rotulo>Hoje · em jornada</Rotulo>
    <ReguaDia marcacoes={['06:02', '10:30', '11:30']} />
  </View>
);

// Detalhe do dia: régua alta com eixo.
export const ComEixo = () => (
  <View style={{ width: 326 }}>
    <ReguaDia marcacoes={['05:40', '09:58', '11:02', '14:58']} altura={10} />
    <EixoRegua />
  </View>
);

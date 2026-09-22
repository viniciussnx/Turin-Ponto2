import { Card, Icon, SectionLabel, StatTile, Text, View, fonts, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;

export const ResumoDoMes = () => (
  <View style={{ width: 358 }}>
    <Card>
      <View style={{ flexDirection: 'row' }}>
        <StatTile value="136:24" label="Trabalhado" />
        <StatTile value="+04:12" label="Saldo" tone="brand" />
        <StatTile value="2" label="Pendências" tone="warn" />
      </View>
    </Card>
  </View>
);

// Pendências do dia: card destacado (borda brandLine).
export const Destacado = () => (
  <View style={{ width: 358 }}>
    <Card highlighted>
      <SectionLabel>Pendências</SectionLabel>
      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        {['Falta a volta do intervalo', 'Intervalo menor que 1 hora'].map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Icon name="alert" color={c.warn} size={18} />
            <Text style={{ flex: 1, color: c.text2, fontFamily: fonts.medium, fontSize: 14 }}>{t}</Text>
          </View>
        ))}
      </View>
    </Card>
  </View>
);

export const Texto = () => (
  <View style={{ width: 358 }}>
    <Card>
      <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 14 }}>
        Nenhuma marcação registrada neste dia.
      </Text>
    </Card>
  </View>
);

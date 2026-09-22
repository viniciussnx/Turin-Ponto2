import { Card, ListRow, SectionLabel, View, spacing } from '@turin/mobile-ds';

const noop = () => {};

export const Padrao = () => <SectionLabel>Marcações</SectionLabel>;

// Acima de um grupo, como "Próximos dias" na escala.
export const AcimaDeLista = () => (
  <View style={{ width: 358, gap: spacing.sm }}>
    <SectionLabel>Próximos dias</SectionLabel>
    <Card style={{ paddingVertical: spacing.xs }}>
      <ListRow icon="bus" title="Sáb, 19 · Manhã" subtitle="05:40–14:20 · Linha 212 · veículo 1147" onPress={noop} />
    </Card>
  </View>
);

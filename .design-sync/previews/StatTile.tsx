import { Card, StatTile, View } from '@turin/mobile-ds';

// Resumo do mês no espelho.
export const Espelho = () => (
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

// Painel do gestor: um tom por status.
export const Gestor = () => (
  <View style={{ width: 358 }}>
    <Card>
      <View style={{ flexDirection: 'row' }}>
        <StatTile value="12" label="Presentes" tone="brand" />
        <StatTile value="2" label="Atrasos" tone="warn" />
        <StatTile value="1" label="Ausentes" tone="bad" />
      </View>
    </Card>
  </View>
);

export const SaldoNegativo = () => (
  <View style={{ width: 358 }}>
    <Card>
      <View style={{ flexDirection: 'row' }}>
        <StatTile value="131:50" label="Trabalhado" />
        <StatTile value="-00:22" label="Saldo" tone="bad" />
      </View>
    </Card>
  </View>
);

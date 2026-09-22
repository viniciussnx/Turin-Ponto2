import { ListRow, Card, Toggle, View, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;
const noop = () => {};
const Divider = () => <View style={{ height: 1, backgroundColor: c.line2 }} />;

// Menu do Perfil, como está em app/(tabs)/perfil.tsx.
export const MenuPerfil = () => (
  <View style={{ width: 358 }}>
    <Card style={{ paddingVertical: spacing.xs }}>
      <ListRow
        icon="mirror"
        title="Minha escala"
        subtitle="Turno, linha e veículo da semana"
        iconTone="brand"
        onPress={noop}
      />
      <Divider />
      <ListRow
        icon="bell"
        title="Notificações"
        subtitle="Avisos de ponto, escala e solicitações"
        onPress={noop}
      />
      <Divider />
      <ListRow
        icon="clock"
        title="Lembretes de ponto"
        subtitle="Alarmes locais antes de cada marcação"
        onPress={noop}
      />
    </Card>
  </View>
);

export const Tons = () => (
  <View style={{ width: 358 }}>
    <Card style={{ paddingVertical: spacing.xs }}>
      <ListRow icon="bus" title="Qui, 24 · Manhã" subtitle="05:40–14:20 · Linha 212 · veículo 1147" iconTone="brand" onPress={noop} />
      <Divider />
      <ListRow icon="alert" title="Marcação ímpar em 18/09" subtitle="Falta a saída do intervalo" iconTone="warn" onPress={noop} />
      <Divider />
      <ListRow icon="coffee" title="Dom, 27 · Folga" subtitle="Folga programada" />
      <Divider />
      <ListRow icon="logout" title="Sair" iconTone="bad" onPress={noop} right={<View />} />
    </Card>
  </View>
);

export const ComInterruptor = () => (
  <View style={{ width: 358 }}>
    <Card style={{ paddingVertical: spacing.xs }}>
      <ListRow icon="moon" title="Tema escuro" subtitle="Segue o sistema quando desligado" right={<Toggle value label="Tema escuro" onChange={noop} />} />
    </Card>
  </View>
);

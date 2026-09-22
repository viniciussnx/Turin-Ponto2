import {
  Card,
  EixoRegua,
  PrimaryButton,
  ProvisionalNotice,
  ReguaDia,
  Screen,
  SectionLabel,
  StatTile,
  Tag,
  Text,
  TurinProvider,
  View,
  fonts,
  spacing,
  useTheme,
} from '@turin/mobile-ds';

const noop = () => {};
const Celular = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: 390, height: 780, overflow: 'hidden' }}>{children}</View>
);

function Marcacao({ hora, tipo, ultimo }: { hora: string; tipo: string; ultimo?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: ultimo ? 0 : 1,
        borderBottomColor: c.line2,
      }}
    >
      <Text style={{ color: c.text2, fontFamily: fonts.medium, fontSize: 15 }}>{tipo}</Text>
      <Text style={{ color: c.text, fontFamily: fonts.mono, fontSize: 15 }}>{hora}</Text>
    </View>
  );
}

function DetalheDoDia() {
  return (
    <Screen title="Sexta, 18 de setembro" subtitle="Trabalhado 08:16 · saldo +00:16">
      <View style={{ gap: spacing.lg }}>
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <StatTile value="08:16" label="Trabalhado" />
            <StatTile value="08:00" label="Previsto" />
            <StatTile value="+00:16" label="Saldo" tone="brand" />
          </View>
        </Card>
        <SectionLabel>Marcações</SectionLabel>
        <Card>
          <View style={{ marginBottom: spacing.lg }}>
            <ReguaDia marcacoes={['05:40', '09:58', '11:02', '14:58']} altura={10} />
            <EixoRegua />
          </View>
          <Marcacao tipo="Entrada" hora="05:40" />
          <Marcacao tipo="Saída intervalo" hora="09:58" />
          <Marcacao tipo="Volta intervalo" hora="11:02" />
          <Marcacao tipo="Saída" hora="14:58" ultimo />
        </Card>
        <PrimaryButton label="Solicitar ajuste" onPress={noop} />
      </View>
    </Screen>
  );
}

// Tela "Detalhe do dia" (app/dia/[data].tsx) com dados de exemplo.
export const DetalheDia = () => (
  <Celular>
    <DetalheDoDia />
  </Celular>
);

// Tela "Minha escala" (app/escala.tsx): aviso provisório + card do dia.
export const MinhaEscala = () => {
  const Conteudo = () => {
    const { c } = useTheme();
    return (
      <Screen title="Minha escala" subtitle="Escala 6x1 · Garagem Centro">
        <View style={{ gap: spacing.lg }}>
          <ProvisionalNotice>
            Escala de demonstração. Turno, linha e veículo ainda não vêm do servidor — o
            Alterdata não expõe esses dados hoje.
          </ProvisionalNotice>
          <Card highlighted>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: c.text, fontFamily: fonts.display, fontSize: 24 }}>Manhã</Text>
                <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 14 }}>
                  Hoje · 05:40–14:20
                </Text>
              </View>
              <Tag text="M1" tone="ok" />
            </View>
          </Card>
        </View>
      </Screen>
    );
  };
  return (
    <Celular>
      <Conteudo />
    </Celular>
  );
};

export const TemaEscuro = () => (
  <Celular>
    <TurinProvider tema="escuro">
      <DetalheDoDia />
    </TurinProvider>
  </Celular>
);

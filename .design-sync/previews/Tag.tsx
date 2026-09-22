import { Tag, TurinProvider, View, useTheme, spacing } from '@turin/mobile-ds';

const Linha = () => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
    <Tag text="Aprovado" tone="ok" />
    <Tag text="Em análise" tone="warn" />
    <Tag text="Recusado" tone="bad" />
    <Tag text="Folga" tone="neutral" />
  </View>
);

export const Tons = () => <Linha />;

// No escuro cada tom tem cor própria (tokens do tema dark).
export const TemaEscuro = () => {
  const Fundo = () => {
    const { c } = useTheme();
    return (
      <View style={{ backgroundColor: c.bg, padding: spacing.lg, borderRadius: 12 }}>
        <Linha />
      </View>
    );
  };
  return (
    <TurinProvider tema="escuro">
      <Fundo />
    </TurinProvider>
  );
};

export const EmJornada = () => <Tag text="Em jornada" tone="ok" />;

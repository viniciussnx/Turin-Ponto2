import { Field, PersonIcon, View, palettes } from '@turin/mobile-ds';

const c = palettes.light;

export const NoCampo = () => (
  <View style={{ width: 342 }}>
    <Field label="Matrícula" defaultValue="04182" leading={<PersonIcon color={c.muted} />} />
  </View>
);

export const Cores = () => (
  <View style={{ flexDirection: 'row', gap: 16 }}>
    <PersonIcon color={c.muted} />
    <PersonIcon color={c.brandInk} />
    <PersonIcon color={c.text} />
  </View>
);

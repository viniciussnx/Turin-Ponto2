import { Field, LockIcon, View, palettes } from '@turin/mobile-ds';

const c = palettes.light;

export const NoCampo = () => (
  <View style={{ width: 342 }}>
    <Field label="Senha" defaultValue="turin2026" secure leading={<LockIcon color={c.muted} />} />
  </View>
);

export const Cores = () => (
  <View style={{ flexDirection: 'row', gap: 16 }}>
    <LockIcon color={c.muted} />
    <LockIcon color={c.brandInk} />
    <LockIcon color={c.text} />
  </View>
);

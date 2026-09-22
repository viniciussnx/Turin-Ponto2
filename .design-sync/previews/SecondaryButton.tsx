import { PrimaryButton, SecondaryButton, View, spacing } from '@turin/mobile-ds';

const noop = () => {};

export const Padrao = () => (
  <View style={{ width: 342 }}>
    <SecondaryButton label="Agora não" onPress={noop} />
  </View>
);

// Par primária + secundária, como no preparo de permissão.
export const ComPrimaria = () => (
  <View style={{ width: 342, gap: spacing.sm }}>
    <PrimaryButton label="Permitir" onPress={noop} />
    <SecondaryButton label="Agora não" onPress={noop} />
  </View>
);

export const Desabilitado = () => (
  <View style={{ width: 342 }}>
    <SecondaryButton label="Tirar outra foto" disabled onPress={noop} />
  </View>
);

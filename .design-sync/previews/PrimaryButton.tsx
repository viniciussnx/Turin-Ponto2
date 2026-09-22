import { PrimaryButton, Icon, View, spacing } from '@turin/mobile-ds';

const noop = () => {};
const Largura = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: 342, gap: spacing.sm }}>{children}</View>
);

// Home: o botão dispara a próxima marcação do dia.
export const Principal = () => (
  <Largura>
    <PrimaryButton label="Registrar entrada" onPress={noop} />
  </Largura>
);

export const ComIcone = () => (
  <Largura>
    <PrimaryButton
      label="Solicitar ajuste"
      icon={<Icon name="doc" color="#FFFFFF" size={20} />}
      onPress={noop}
    />
  </Largura>
);

// Login enviando e login com campos vazios.
export const Estados = () => (
  <Largura>
    <PrimaryButton label="Entrar" loading onPress={noop} />
    <PrimaryButton label="Entrar" disabled onPress={noop} />
  </Largura>
);

export const Destrutivo = () => (
  <Largura>
    <PrimaryButton label="Cancelar solicitação" destrutivo onPress={noop} />
  </Largura>
);

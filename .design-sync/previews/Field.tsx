import { Field, PersonIcon, LockIcon, View, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;
const Largura = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: 342, gap: spacing.lg }}>{children}</View>
);

// Os dois campos da tela de login.
export const Login = () => (
  <Largura>
    <Field
      label="Matrícula"
      defaultValue="04182"
      keyboardType="number-pad"
      leading={<PersonIcon color={c.muted} />}
    />
    <Field label="Senha" defaultValue="turin2026" secure leading={<LockIcon color={c.muted} />} />
  </Largura>
);

export const Vazio = () => (
  <Largura>
    <Field label="Matrícula" placeholder="04182" leading={<PersonIcon color={c.muted} />} />
  </Largura>
);

export const ComErro = () => (
  <Largura>
    <Field
      label="Senha"
      defaultValue="1234"
      secure
      leading={<LockIcon color={c.muted} />}
      error="Matrícula ou senha incorretas."
    />
  </Largura>
);

// Justificativa na nova solicitação.
export const Multilinha = () => (
  <Largura>
    <Field
      label="Justificativa"
      multiline
      numberOfLines={3}
      defaultValue="Esqueci de bater a saída do intervalo; voltei às 12:02 com o carro 1147."
    />
  </Largura>
);

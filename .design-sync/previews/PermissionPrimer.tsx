import { PermissionPrimer, View, palettes, spacing } from '@turin/mobile-ds';

const c = palettes.light;
const noop = () => {};
const Tela = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: 390, backgroundColor: c.bg, padding: spacing.xl }}>{children}</View>
);

// Textos reais de app/registrar.tsx.
export const Localizacao = () => (
  <Tela>
    <PermissionPrimer
      icone="pin"
      titulo="Confirmar que você está na garagem"
      porque="No momento da marcação o app lê a posição do aparelho uma única vez, para registrar de onde o ponto foi batido. Sem ela o ponto é registrado do mesmo jeito — só fica sem a localização."
      aoPermitir={noop}
      aoPular={noop}
    />
  </Tela>
);

export const Camera = () => (
  <Tela>
    <PermissionPrimer
      icone="face"
      titulo="Uma foto no momento do registro"
      porque="A foto fica guardada no aparelho e serve de conferência se houver dúvida sobre uma marcação. Você pode registrar o ponto sem ela."
      aoPermitir={noop}
      aoPular={noop}
      rotuloPular="Registrar sem foto"
    />
  </Tela>
);

export const Negada = () => (
  <Tela>
    <PermissionPrimer
      icone="pin"
      titulo="Localização desligada"
      porque="Para registrar de onde o ponto foi batido, libere a localização para o Meu Ponto nos Ajustes."
      negada
      aoPermitir={noop}
      aoPular={noop}
    />
  </Tela>
);

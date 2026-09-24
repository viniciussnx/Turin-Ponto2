import { Linking, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius, spacing } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { PrimaryButton, SecondaryButton } from './ui';

/*
 * Preparo de permissão ("priming").
 *
 * O app disparava dois prompts do sistema em sequência — localização e
 * câmera — sem nenhuma explicação antes, e quem negasse ficava num beco sem
 * saída: o prompt do iOS só aparece uma vez, e o app não oferecia caminho
 * para os Ajustes.
 *
 * `privacy.md` pede: *"Request permission only when your app clearly needs
 * access… explain why your app needs the information."* A tela abaixo é o
 * "antes": diz o porquê em uma frase, na hora em que a pessoa já entendeu o
 * que vai fazer, e só então chama o prompt do sistema. Quem recusa aqui não
 * gasta a única chance do prompt nativo.
 */
export function PermissionPrimer({
  icone,
  titulo,
  porque,
  negada,
  aoPermitir,
  aoPular,
  rotuloPular = 'Agora não',
}: {
  icone: IconName;
  titulo: string;
  /// Uma frase, concreta, no idioma de quem usa. Não é o texto do Info.plist.
  porque: string;
  /// Quando a permissão já foi negada antes: o caminho vira os Ajustes.
  negada?: boolean;
  aoPermitir: () => void;
  aoPular: () => void;
  rotuloPular?: string;
}) {
  const { c } = useTheme();

  return (
    <View style={{ gap: spacing.lg, alignItems: 'center', paddingVertical: spacing.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.lg,
          backgroundColor: c.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icone} color={c.brandInk} size={30} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text
          accessibilityRole="header"
          style={{
            color: c.text,
            fontFamily: fonts.bold,
            fontSize: 20,
            letterSpacing: -0.4,
            textAlign: 'center',
          }}
        >
          {titulo}
        </Text>
        <Text
          style={{
            color: c.text2,
            fontFamily: fonts.regular,
            fontSize: 15,
            lineHeight: 22,
            textAlign: 'center',
          }}
        >
          {porque}
        </Text>
      </View>

      <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
        {negada ? (
          <PrimaryButton
            label="Abrir os Ajustes"
            onPress={() => void Linking.openSettings()}
          />
        ) : (
          <PrimaryButton label="Permitir" onPress={aoPermitir} />
        )}
        <SecondaryButton label={rotuloPular} onPress={aoPular} />
      </View>

      {negada ? (
        <Text
          style={{
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
            textAlign: 'center',
          }}
        >
          O sistema só pergunta uma vez. Para mudar depois, é pelos Ajustes do
          aparelho.
        </Text>
      ) : null}
    </View>
  );
}

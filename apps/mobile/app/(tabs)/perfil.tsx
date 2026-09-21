import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import {
  BrandHeader,
  Card,
  ListRow,
  SectionLabel,
  Toggle,
} from '../../src/components/layout';
import { usePreferences } from '../../src/prefs/usePreferences';

/// Tela 08 do protótipo — perfil e preferências.
export default function PerfilScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { employee, signOut } = useAuth();
  const { prefs, update } = usePreferences();

  function confirmSignOut() {
    Alert.alert('Sair do app', 'Você precisará entrar com matrícula e senha novamente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader title="Perfil" compact>
        <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#0BAF29', fontFamily: fonts.display, fontSize: 28 }}>
              {initials(employee?.name ?? '')}
            </Text>
          </View>
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.display, fontSize: 24 }}>
            {(employee?.name ?? '').toUpperCase()}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontFamily: fonts.regular,
              fontSize: 14,
            }}
          >
            {[employee?.position, `Matrícula ${employee?.registration ?? ''}`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </BrandHeader>

      <ScrollView
        style={{ flex: 1, marginTop: -spacing.xxl }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.lg,
        }}
      >
        <Card style={{ paddingVertical: spacing.xs }}>
          <ListRow
            icon="mirror"
            title="Minha escala"
            subtitle="Turno, linha e veículo da semana"
            iconTone="brand"
            onPress={() => router.push('/escala')}
          />
          <Divider />
          <ListRow
            icon="bell"
            title="Notificações"
            subtitle="Avisos de ponto, escala e solicitações"
            onPress={() => router.push('/notificacoes')}
          />
          <Divider />
          <ListRow
            icon="clock"
            title="Lembretes de ponto"
            subtitle="Alarmes locais antes de cada marcação"
            onPress={() => router.push('/lembretes')}
          />
          <Divider />
          <ListRow
            icon="user"
            title="Presença da equipe"
            subtitle="Somente para encarregados"
            onPress={() => router.push('/gestor')}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <SectionLabel>Preferências</SectionLabel>

          <PrefRow
            icon="bell"
            label="Notificações push"
            value={prefs.push}
            onChange={(value) => void update({ push: value })}
          />
          <PrefRow
            icon="clock"
            label="Lembrete de ponto"
            value={prefs.reminders}
            onChange={(value) => void update({ reminders: value })}
          />
          <PrefRow
            icon="moon"
            label="Tema escuro"
            // `null` = segue o sistema. Ligar aqui fixa o escuro.
            value={prefs.darkMode === true}
            onChange={(value) => void update({ darkMode: value ? true : null })}
            hint={prefs.darkMode === null ? 'Seguindo o sistema' : undefined}
          />
          <PrefRow
            icon="face"
            label="Entrar com biometria"
            value={prefs.biometrics}
            onChange={(value) => void update({ biometrics: value })}
            hint="Em breve"
            disabled
          />
        </Card>

        <Card style={{ paddingVertical: spacing.xs }}>
          <ListRow
            icon="shield"
            title="Trocar senha"
            subtitle="Altere a senha de acesso ao app"
            onPress={() => router.push('/trocar-senha')}
          />
          <Divider />
          <ListRow
            icon="logout"
            title="Sair"
            iconTone="bad"
            onPress={confirmSignOut}
            right={<View />}
          />
        </Card>

        <Text
          style={{
            textAlign: 'center',
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 12,
          }}
        >
          {employee?.company.name} · Meu Ponto Turin 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function PrefRow({
  icon,
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  icon: 'bell' | 'clock' | 'moon' | 'face';
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
  disabled?: boolean;
}) {
  const { c } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.sm,
          backgroundColor: c.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color={c.text2} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontFamily: fonts.medium, fontSize: 15 }}>{label}</Text>
        {hint ? (
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>{hint}</Text>
        ) : null}
      </View>
      <Toggle value={value} onChange={disabled ? () => undefined : onChange} />
    </View>
  );
}

function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.line2, marginLeft: 50 }} />;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

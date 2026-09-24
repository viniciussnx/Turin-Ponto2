import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useBarraClara } from '../../src/theme/useBarraClara';
import { fonts } from '../../src/theme/tokens';
import { Icon, type IconName } from '../../src/components/Icon';
import { Avatar } from '../../src/components/ui';
import { Card, Divider, ListRow, SectionLabel, Toggle } from '../../src/components/layout';
import { usePreferences } from '../../src/prefs/usePreferences';

/// Tela 08 do protótipo — perfil e configurações.
export default function PerfilScreen() {
  const { c } = useTheme();
  useBarraClara();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { employee, signOut } = useAuth();
  const { prefs, update } = usePreferences();

  function confirmSignOut() {
    Alert.alert('Sair da conta', 'Você precisará entrar com matrícula e senha novamente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  function mostrarDados() {
    if (!employee) return;
    Alert.alert(
      'Dados pessoais',
      `${employee.name}\nMatrícula ${employee.registration}\n${employee.position ?? 'Colaborador'} · ${employee.company.name}\n\nPara corrigir algum dado, procure o RH.`,
    );
  }

  function emBreve(titulo: string) {
    Alert.alert(titulo, 'Esta área ainda não está disponível no app.');
  }

  const cargo = [employee?.position, employee?.company.name].filter(Boolean).join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
        {/* Cabeçalho verde: `padding:10px 22px 30px`, avatar de 66 pt (raio 20). */}
        <View style={{ backgroundColor: c.brand, paddingTop: insets.top + 10, paddingHorizontal: 22, paddingBottom: 30, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              right: -50,
              bottom: -70,
              width: 190,
              height: 190,
              borderRadius: 95,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <Avatar name={employee?.name ?? ''} size={66} raio={20} tinta="#08871F" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 20, lineHeight: 23, letterSpacing: -0.4 }}>
                {employee?.name ?? ''}
              </Text>
              {cargo ? (
                <Text style={{ marginTop: 3, color: 'rgba(255,255,255,0.82)', fontFamily: fonts.regular, fontSize: 13 }}>{cargo}</Text>
              ) : null}
              <View
                style={{
                  marginTop: 7,
                  alignSelf: 'flex-start',
                  height: 24,
                  paddingHorizontal: 9,
                  borderRadius: 7,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.66 }}>
                  {`MATRÍCULA ${employee?.registration ?? ''}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: -16, gap: 12 }}>
          <Card sombra style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow icon="user" title="Dados pessoais" subtitle="Nome, matrícula, cargo e empresa" onPress={mostrarDados} />
            <Divider />
            <ListRow icon="mirror" title="Jornada e escala" subtitle="Espelho de ponto do mês" onPress={() => router.push('/espelho')} />
            <Divider />
            <ListRow icon="doc" title="Documentos e recibos" subtitle="Holerites e comprovantes" onPress={() => emBreve('Documentos e recibos')} />
            <Divider />
            <ListRow icon="shield" title="Segurança" subtitle="Trocar a senha de acesso" onPress={() => router.push('/trocar-senha')} />

          </Card>

          <SectionLabel style={{ marginTop: 2, marginBottom: -2 }}>Preferências</SectionLabel>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* Push, lembrete e Face ID gravam a preferência, mas nada os
                consome ainda (não há push nem biometria no app). Ficam
                visíveis como no protótipo, porém travados com "em breve":
                prometer um aviso que não chega faz o motorista confiar num
                lembrete que não existe. */}
            <LinhaPreferencia icon="bell" label="Notificações push" value={prefs.push} emBreve />
            <Divider />
            {/* Os alarmes locais ficam na tela de Lembretes (tela 14). */}
            <LinhaPreferencia icon="clock" label="Lembrete de ponto" value={prefs.reminders} emBreve onAbrir={() => router.push('/lembretes')} />
            <Divider />
            <LinhaPreferencia
              icon="moon"
              label="Tema escuro"
              // `null` = segue o sistema. Ligar aqui fixa o escuro.
              value={prefs.darkMode === true}
              onChange={(value) => void update({ darkMode: value ? true : null })}
            />
            <Divider />
            <LinhaPreferencia icon="face" label="Login por Face ID" value={prefs.biometrics} emBreve />
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow icon="user" title="Presença da equipe" subtitle="Somente para encarregados" onPress={() => router.push('/gestor')} />
          </Card>

          <Pressable
            onPress={confirmSignOut}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 50,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.line,
              backgroundColor: pressed ? 'rgba(214,69,69,0.08)' : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
            })}
          >
            <Icon name="logout" color={c.bad} size={19} strokeWidth={1.9} />
            <Text style={{ color: c.bad, fontFamily: fonts.semibold, fontSize: 14 }}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/// Linha de preferência: ícone solto de 19 pt em `--text2`, rótulo
/// `600 14px`, interruptor à direita, altura mínima de 56 pt.
function LinhaPreferencia({
  icon,
  label,
  value,
  onChange,
  emBreve,
  onAbrir,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange?: (value: boolean) => void;
  emBreve?: boolean;
  /// Toque no rótulo abre a tela ligada à preferência.
  onAbrir?: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, minHeight: 56 }}>
      <Icon name={icon} color={c.text} size={19} />
      <Pressable style={{ flex: 1 }} onPress={onAbrir} disabled={!onAbrir} accessibilityRole={onAbrir ? 'button' : undefined}>
        <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>{label}</Text>
        {onAbrir ? (
          <Text style={{ color: c.brandInk, fontFamily: fonts.medium, fontSize: 11.5 }}>Configurar horários</Text>
        ) : emBreve ? (
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 11.5 }}>Em breve</Text>
        ) : null}
      </Pressable>
      <Toggle
        value={value}
        disabled={emBreve}
        label={emBreve ? `${label}. Em breve` : label}
        onChange={(v) => onChange?.(v)}
      />
    </View>
  );
}

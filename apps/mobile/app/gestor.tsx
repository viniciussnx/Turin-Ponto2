import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeProvider';
import { useBarraClara } from '../src/theme/useBarraClara';
import { fonts } from '../src/theme/tokens';
import { Icon } from '../src/components/Icon';
import { SecondaryButton } from '../src/components/ui';
import { ChipFilters, EmptyState, Footer, Tag, type Tone } from '../src/components/layout';
import { getTeamPresence, type TeamMember } from '../src/api/roster';

const FILTERS = ['Todos', 'Atrasos', 'Ausentes', 'Presentes'] as const;
type Filter = (typeof FILTERS)[number];

/// Tela 09 do protótipo — presença diária, visão do encarregado.
///
/// Exige um perfil de gestor que o token do app ainda não carrega. Enquanto o
/// backend não expuser `GET /team/presence` para encarregados, a tela roda
/// com dados de demonstração — a estrutura é a definitiva.
export default function GestorScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useBarraClara();

  const [filter, setFilter] = useState<Filter>('Todos');
  const team = useMemo(() => getTeamPresence(), []);
  const agora = useMemo(() => new Date(), []);

  const counts = useMemo(
    () => ({
      present: team.filter((m) => m.status === 'Presente').length,
      late: team.filter((m) => m.status === 'Atraso').length,
      absent: team.filter((m) => m.status === 'Ausente').length,
    }),
    [team],
  );
  const total = Math.max(team.length, 1);
  const cumprida = Math.round(((counts.present + counts.late) / total) * 100);

  const visible = useMemo(() => {
    if (filter === 'Presentes') return team.filter((m) => m.status === 'Presente');
    if (filter === 'Atrasos') return team.filter((m) => m.status === 'Atraso');
    if (filter === 'Ausentes') return team.filter((m) => m.status === 'Ausente');
    return team;
  }, [team, filter]);

  async function exportar() {
    const linhas = team.map((m) => `${m.name} — ${m.status}${m.time !== '—' ? ` às ${m.time}` : ''}`);
    await Share.share({
      title: 'Presença do dia',
      message: `Presença diária · ${dataLonga(agora)}\n${counts.present} presentes, ${counts.late} atrasos, ${counts.absent} ausentes\n\n${linhas.join('\n')}`,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Cabeçalho escuro: `background:var(--deep); padding:8px 20px 24px`. */}
      <View style={{ backgroundColor: c.deep, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {router.canGoBack() ? (
              <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
                <Icon name="chevron-left" color="#FFFFFF" size={22} strokeWidth={2} />
              </Pressable>
            ) : null}
            <Text accessibilityRole="header" style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.36 }}>
              Presença diária
            </Text>
          </View>
          <View style={{ height: 32, paddingHorizontal: 11, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 12 }}>Contagem</Text>
          </View>
        </View>
        <Text style={{ marginTop: 6, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.regular, fontSize: 13 }}>
          {`${dataLonga(agora)} · atualizado ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        </Text>

        <View style={{ marginTop: 18, flexDirection: 'row', gap: 9 }}>
          <Numero valor={counts.present} rotulo="Presentes" cor="#5BE07A" />
          <Numero valor={counts.late} rotulo="Atrasos" cor="#F0BE5A" />
          <Numero valor={counts.absent} rotulo="Ausentes" cor="#F08A85" />
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: fonts.medium, fontSize: 11 }}>Escala cumprida</Text>
            <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 11 }}>{`${cumprida}%`}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', overflow: 'hidden' }}>
            <View style={{ width: `${(counts.present / total) * 100}%`, backgroundColor: c.brand }} />
            <View style={{ width: `${(counts.late / total) * 100}%`, backgroundColor: '#E8A93A' }} />
            <View style={{ width: `${(counts.absent / total) * 100}%`, backgroundColor: '#D64545' }} />
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 13, paddingHorizontal: 18, paddingBottom: 10 }}>
        <ChipFilters options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 14, gap: 8 }}>
        {visible.length === 0 ? (
          <EmptyState icon="user" title={`Ninguém em "${filter}"`} />
        ) : (
          visible.map((member) => <LinhaMembro key={member.id} member={member} />)
        )}
        <Text style={{ marginTop: 6, textAlign: 'center', color: c.muted, fontFamily: fonts.regular, fontSize: 11.5 }}>
          Dados de demonstração: a presença da equipe ainda não vem do servidor.
        </Text>
      </ScrollView>

      <Footer>
        <SecondaryButton label="Exportar relatório do dia" iconName="doc" tom="text" altura={52} onPress={() => void exportar()} />
      </Footer>
    </View>
  );
}

function Numero({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 13,
        paddingHorizontal: 12,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Text style={{ color: cor, fontFamily: fonts.bold, fontSize: 23, lineHeight: 25, letterSpacing: -0.46 }}>{valor}</Text>
      <Text
        style={{
          marginTop: 4,
          color: 'rgba(255,255,255,0.62)',
          fontFamily: fonts.semibold,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {rotulo}
      </Text>
    </View>
  );
}

function LinhaMembro({ member }: { member: TeamMember }) {
  const { c } = useTheme();
  const tone: Tone = member.status === 'Presente' ? 'ok' : member.status === 'Atraso' ? 'warn' : 'bad';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 15,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line2,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.text2, fontFamily: fonts.bold, fontSize: 13 }}>{member.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
          {member.name}
        </Text>
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 11.5 }}>{member.role}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Tag text={member.status} tone={tone} />
        <Text style={{ marginTop: 3, color: c.muted, fontFamily: fonts.semibold, fontSize: 12 }}>{member.time}</Text>
      </View>
    </View>
  );
}

/// "Quinta, 12 de setembro".
function dataLonga(date: Date): string {
  const semana = date.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  const resto = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${resto}`;
}

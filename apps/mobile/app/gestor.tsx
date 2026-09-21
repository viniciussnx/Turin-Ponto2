import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../src/theme/tokens';
import {
  Card,
  ChipFilters,
  EmptyState,
  ProvisionalNotice,
  Screen,
  SectionLabel,
  StatTile,
  Tag,
} from '../src/components/layout';
import { getTeamPresence, type TeamMember } from '../src/api/roster';

const FILTERS = ['Todos', 'Presentes', 'Atrasos', 'Ausentes'] as const;
type Filter = (typeof FILTERS)[number];

/// Tela 09 do protótipo — presença da equipe, para o encarregado.
///
/// Exige um perfil de gestor que o token do app ainda não carrega: o JWT do
/// funcionário não tem papel, só o do painel tem. Enquanto o backend não
/// expuser `GET /team/presence` para encarregados, a tela roda com dados de
/// demonstração — a estrutura é a definitiva.
export default function GestorScreen() {
  const { c } = useTheme();
  const [filter, setFilter] = useState<Filter>('Todos');
  const team = useMemo(() => getTeamPresence(), []);

  const counts = useMemo(
    () => ({
      present: team.filter((member) => member.status === 'Presente').length,
      late: team.filter((member) => member.status === 'Atraso').length,
      absent: team.filter((member) => member.status === 'Ausente').length,
    }),
    [team],
  );

  const visible = useMemo(() => {
    if (filter === 'Presentes') return team.filter((m) => m.status === 'Presente');
    if (filter === 'Atrasos') return team.filter((m) => m.status === 'Atraso');
    if (filter === 'Ausentes') return team.filter((m) => m.status === 'Ausente');
    return team;
  }, [team, filter]);

  return (
    <Screen title="Presença da equipe" subtitle={today()}>
      <View style={{ gap: spacing.lg }}>
        <ProvisionalNotice>
          Dados de demonstração. A visão de gestor precisa de um perfil de encarregado no
          servidor, que ainda não existe para o app.
        </ProvisionalNotice>

        <Card>
          <View style={{ flexDirection: 'row' }}>
            <StatTile value={String(counts.present)} label="Presentes" tone="brand" />
            <StatTile value={String(counts.late)} label="Atrasos" tone="warn" />
            <StatTile value={String(counts.absent)} label="Ausentes" tone="bad" />
          </View>
        </Card>

        <ChipFilters options={FILTERS} value={filter} onChange={setFilter} />

        {visible.length === 0 ? (
          <EmptyState icon="user" title={`Ninguém em "${filter}"`} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            <SectionLabel>{`${visible.length} pessoas`}</SectionLabel>
            {visible.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const { c } = useTheme();
  const tone =
    member.status === 'Presente' ? 'ok' : member.status === 'Atraso' ? 'warn' : 'bad';

  return (
    <Card
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: c.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: c.text2, fontFamily: fonts.bold, fontSize: 14 }}>
          {member.initials}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>
          {member.name}
        </Text>
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
          {member.role}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Tag text={member.status} tone={tone} />
        <Text style={{ color: c.muted, fontFamily: fonts.semibold, fontSize: 13 }}>
          {member.time}
        </Text>
      </View>
    </Card>
  );
}

function today(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

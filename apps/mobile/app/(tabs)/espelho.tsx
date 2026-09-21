import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import {
  BrandHeader,
  Card,
  ChipFilters,
  EmptyState,
  SectionLabel,
  StatTile,
  Tag,
} from '../../src/components/layout';
import {
  dayNumber,
  dayTag,
  marksLine,
  monthLabel,
  untilToday,
  useTimesheet,
  weekdayLabel,
  type TimesheetDay,
} from '../../src/api/timesheet';

const FILTERS = ['Todos', 'Pendências', 'Extras'] as const;
type Filter = (typeof FILTERS)[number];

/// Tela 05 do protótipo — espelho de ponto.
export default function EspelhoScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [month, setMonth] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>('Todos');
  const { data, loading, error, reload } = useTimesheet(month);

  const days = useMemo(() => {
    const visible = untilToday(data?.days ?? []).reverse();
    if (filter === 'Pendências') return visible.filter((day) => day.hasInconsistency);
    if (filter === 'Extras') return visible.filter((day) => day.overtimeMinutes > 0);
    return visible;
  }, [data, filter]);

  const totals = data?.totals;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader title="Espelho de ponto" subtitle={monthLabel(month)} compact>
        <MonthSwitch month={month} onChange={setMonth} />
      </BrandHeader>

      <ScrollView
        style={{ flex: 1, marginTop: -spacing.xxl }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={c.brand} />
        }
      >
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <StatTile value={totals?.worked ?? '--:--'} label="Trabalhado" />
            <StatTile
              value={totals?.balance ?? '--:--'}
              label="Saldo"
              tone={
                (totals?.balanceMinutes ?? 0) > 0
                  ? 'brand'
                  : (totals?.balanceMinutes ?? 0) < 0
                    ? 'bad'
                    : 'default'
              }
            />
            <StatTile
              value={String(totals?.inconsistentDays ?? 0)}
              label="Pendências"
              tone={(totals?.inconsistentDays ?? 0) > 0 ? 'warn' : 'default'}
            />
          </View>
        </Card>

        <ChipFilters options={FILTERS} value={filter} onChange={setFilter} />

        {error ? (
          <Card>
            <Text style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 14 }}>{error}</Text>
          </Card>
        ) : null}

        {loading && !data ? (
          <ActivityIndicator color={c.brand} style={{ marginTop: spacing.xxl }} />
        ) : days.length === 0 ? (
          <EmptyState
            icon="mirror"
            title="Nada por aqui"
            detail={
              filter === 'Todos'
                ? 'Ainda não há marcações neste mês.'
                : `Nenhum dia em "${filter}" neste mês.`
            }
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            <SectionLabel>Dias</SectionLabel>
            {days.map((day) => (
              <DayRow
                key={day.date}
                day={day}
                onPress={() => router.push(`/dia/${day.date}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MonthSwitch({ month, onChange }: { month: Date; onChange: (value: Date) => void }) {
  const shift = (delta: number) =>
    onChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  // O mês corrente é o limite: não há espelho do futuro.
  const isCurrentMonth =
    month.getFullYear() === new Date().getFullYear() &&
    month.getMonth() === new Date().getMonth();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
      }}
    >
      <Pressable onPress={() => shift(-1)} hitSlop={10} accessibilityLabel="Mês anterior">
        <Icon name="chevron-left" color="#FFFFFF" size={22} />
      </Pressable>
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 14 }}>
        {monthLabel(month)}
      </Text>
      <Pressable
        onPress={() => shift(1)}
        hitSlop={10}
        disabled={isCurrentMonth}
        accessibilityLabel="Próximo mês"
      >
        <Icon
          name="chevron-right"
          color={isCurrentMonth ? 'rgba(255,255,255,0.35)' : '#FFFFFF'}
          size={22}
        />
      </Pressable>
    </View>
  );
}

function DayRow({ day, onPress }: { day: TimesheetDay; onPress: () => void }) {
  const { c } = useTheme();
  const tag = dayTag(day);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: day.hasInconsistency ? 'rgba(217,138,0,0.35)' : c.line,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 42, alignItems: 'center' }}>
        <Text style={{ color: c.text, fontFamily: fonts.display, fontSize: 22 }}>
          {dayNumber(day.date)}
        </Text>
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11 }}>
          {weekdayLabel(day.weekday)}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.text2, fontFamily: fonts.medium, fontSize: 13 }}>
          {marksLine(day)}
        </Text>
        <Tag text={tag.text} tone={tag.tone} />
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            color:
              day.balanceMinutes > 0 ? c.brandInk : day.balanceMinutes < 0 ? c.bad : c.muted,
            fontFamily: fonts.semibold,
            fontSize: 14,
          }}
        >
          {day.balanceMinutes === 0 ? '—' : day.balance}
        </Text>
        <Icon name="chevron-right" color={c.muted} size={18} />
      </View>
    </Pressable>
  );
}

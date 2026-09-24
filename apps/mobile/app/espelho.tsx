import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts } from '../src/theme/tokens';
import { Icon } from '../src/components/Icon';
import { IconButton } from '../src/components/ui';
import { Card, ChipFilters, EmptyState, TopBar, useToneColors } from '../src/components/layout';
import {
  dayNumber,
  dayTag,
  marksLine,
  monthLabel,
  untilToday,
  useTimesheet,
  weekdayLabel,
  type TimesheetDay,
} from '../src/api/timesheet';

const FILTERS = ['Todos', 'Pendências', 'Extras'] as const;
type Filter = (typeof FILTERS)[number];

/// Tela 05 do protótipo anterior ("Espelho de ponto — histórico do mês").
/// Saiu da barra de abas na versão atual do protótipo; continua acessível
/// pelo Perfil ("Jornada e escala") e segue o estilo novo (Public Sans).
export default function EspelhoScreen() {
  const { c } = useTheme();
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

  const resumo = useMemo(() => {
    const lista = untilToday(data?.days ?? []);
    return {
      trabalhado: data ? horas(data.totals.workedMinutes) : '—',
      extras: data ? hhmm(data.totals.overtimeMinutes) : '—',
      pendencias: String(data?.totals.inconsistentDays ?? 0),
      faltas: String(lista.filter((d) => !d.isRestDay && !d.isHoliday && d.punches.length === 0 && d.expectedMinutes > 0).length),
    };
  }, [data]);

  const hoje = new Date();
  const noMesAtual = month.getFullYear() === hoje.getFullYear() && month.getMonth() === hoje.getMonth();

  async function compartilhar() {
    if (!data) return;
    await Share.share({
      title: 'Espelho de ponto',
      message:
        `Espelho de ponto · ${monthLabel(month)}\n` +
        `Trabalhado ${data.totals.worked} · previsto ${data.totals.expected} · saldo ${data.totals.balance}\n\n` +
        untilToday(data.days)
          .map((d) => `${dayNumber(d.date)}/${d.date.slice(5, 7)} ${weekdayLabel(d.weekday)} — ${marksLine(d)}`)
          .join('\n'),
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="Espelho de ponto"
        big
        onBack={router.canGoBack() ? () => router.back() : undefined}
        right={<IconButton name="doc" label="Compartilhar espelho" cor={c.text2} onPress={() => void compartilhar()} />}
      >
        <View style={{ marginTop: -2 }}>
          {/* Seletor de mês: `height:46px; border-radius:14px; background:var(--surface2)`. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 46, paddingHorizontal: 8, borderRadius: 14, backgroundColor: c.surface2 }}>
            <BotaoMes icone="chevron-left" label="Mês anterior" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
            <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{capitalizar(monthLabel(month).replace(' de ', ' '))}</Text>
            <BotaoMes
              icone="chevron-right"
              label="Próximo mês"
              desabilitado={noMesAtual}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            />
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 7 }}>
            <Resumo valor={resumo.trabalhado} rotulo="Trabalh." cor={c.text} />
            <Resumo valor={resumo.extras} rotulo="Extras" cor={c.brandInk} />
            <Resumo valor={resumo.pendencias} rotulo="Pendências" cor={c.warn} />
            <Resumo valor={resumo.faltas} rotulo="Faltas" cor={c.text} />
          </View>
        </View>
      </TopBar>

      <View style={{ paddingTop: 12, paddingHorizontal: 18, paddingBottom: 10 }}>
        <ChipFilters options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 18, gap: 8 }}
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={c.brand} />}
      >
        {error ? (
          <Card>
            <Text style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 14 }}>{error}</Text>
          </Card>
        ) : null}
        {loading && !data ? (
          <ActivityIndicator color={c.brand} style={{ marginTop: 28 }} />
        ) : days.length === 0 ? (
          <EmptyState
            icon="mirror"
            title="Nada por aqui"
            detail={filter === 'Todos' ? 'Ainda não há marcações neste mês.' : `Nenhum dia em "${filter}" neste mês.`}
          />
        ) : (
          days.map((day) => <LinhaDia key={day.date} day={day} onPress={() => router.push(`/dia/${day.date}`)} />)
        )}
      </ScrollView>
    </View>
  );
}

function BotaoMes({ icone, label, onPress, desabilitado }: { icone: 'chevron-left' | 'chevron-right'; label: string; onPress: () => void; desabilitado?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: desabilitado ? 0.45 : 1,
      }}
    >
      <Icon name={icone} color={desabilitado ? c.muted : c.text2} size={17} strokeWidth={2} />
    </Pressable>
  );
}

function Resumo({ valor, rotulo, cor }: { valor: string; rotulo: string; cor: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, backgroundColor: c.surface2, alignItems: 'center' }}>
      <Text style={{ color: cor, fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.36 }}>{valor}</Text>
      <Text style={{ marginTop: 1, color: c.muted, fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {rotulo}
      </Text>
    </View>
  );
}

/// Linha do dia: número `700 22px` + dia da semana, divisória, marcações,
/// situação colorida e o saldo à direita.
function LinhaDia({ day, onPress }: { day: TimesheetDay; onPress: () => void }) {
  const { c } = useTheme();
  const tag = dayTag(day);
  const tinta = useToneColors()(tag.tone).ink;
  const saldo =
    day.balanceMinutes === 0 || day.punches.length === 0
      ? '—'
      : day.balanceMinutes > 0 && !/^[+]/.test(day.balance)
        ? `+${day.balance}`
        : day.balance;
  const corSaldo = saldo === '—' ? c.muted : day.balanceMinutes > 0 ? c.brandInk : day.balanceMinutes < 0 ? c.bad : c.muted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: pressed ? c.surface2 : c.surface,
        borderWidth: 1,
        borderColor: pressed ? c.brandLine : c.line2,
      })}
    >
      <View style={{ width: 44, alignItems: 'center' }}>
        <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 22, lineHeight: 23, letterSpacing: -0.44 }}>{dayNumber(day.date)}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {weekdayLabel(day.weekday)}
        </Text>
      </View>
      <View style={{ width: 1, height: 34, backgroundColor: c.line }} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: c.text2, fontFamily: fonts.semibold, fontSize: 13 }}>
          {marksLine(day)}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 3, color: tag.tone === 'neutral' ? c.muted : tinta, fontFamily: fonts.medium, fontSize: 11 }}>
          {tag.text}
        </Text>
      </View>
      <Text style={{ color: corSaldo, fontFamily: fonts.bold, fontSize: 15 }}>{saldo}</Text>
    </Pressable>
  );
}

/// 10110 min → "168h".
function horas(minutos: number): string {
  return `${Math.floor(minutos / 60)}h`;
}

/// 740 min → "12:20".
function hhmm(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

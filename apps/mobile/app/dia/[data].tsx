import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, spacing } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { PrimaryButton } from '../../src/components/ui';
import { Card, EmptyState, Screen, SectionLabel } from '../../src/components/layout';
import { EixoRegua, ReguaDia } from '../../src/components/ReguaDia';
import { dayTag, useTimesheet, weekdayLabel, type TimesheetDay } from '../../src/api/timesheet';
import { labelForKind } from '../../src/punch/useToday';
import type { PunchKind } from '../../src/punch/queue';

/// Tela 06 do protótipo — detalhe do dia, com a linha do tempo das marcações.
export default function DayDetailScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { data: isoDate } = useLocalSearchParams<{ data: string }>();

  // Reaproveita a apuração do mês inteiro: o espelho provavelmente já a
  // carregou, e a API não tem rota de dia isolado.
  const month = useMemo(() => new Date(`${isoDate}T12:00:00`), [isoDate]);
  const { data, loading } = useTimesheet(month);

  const day = data?.days.find((item) => item.date === isoDate);

  return (
    <Screen
      title={day ? `${weekdayLabel(day.weekday)}, ${formatDay(isoDate)}` : formatDay(isoDate)}
      subtitle={day ? summary(day) : undefined}
    >
      {loading && !day ? (
        <ActivityIndicator color={c.brandAction} style={{ marginTop: spacing.xxl }} />
      ) : !day ? (
        <EmptyState icon="alert" title="Dia não encontrado" />
      ) : (
        <View style={{ gap: spacing.lg }}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Metric label="Trabalhado" value={day.worked} />
              <Metric label="Previsto" value={day.expected} />
              <Metric
                label="Saldo"
                value={day.balanceMinutes === 0 ? '—' : day.balance}
                tone={day.balanceMinutes > 0 ? 'ok' : day.balanceMinutes < 0 ? 'bad' : 'muted'}
              />
            </View>
          </Card>

          {day.inconsistencies.length > 0 ? (
            <Card highlighted>
              <SectionLabel>Pendências</SectionLabel>
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {day.inconsistencies.map((item) => (
                  <View
                    key={item.code}
                    style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}
                  >
                    <Icon name="alert" color={c.warn} size={18} />
                    <Text
                      style={{
                        flex: 1,
                        color: c.text2,
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {item.message}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <SectionLabel>Marcações</SectionLabel>
            {day.punches.length === 0 ? (
              <Card>
                <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 14 }}>
                  Nenhuma marcação registrada neste dia.
                </Text>
              </Card>
            ) : (
              <Card>
                {/* No detalhe há largura para a régua com o eixo: ela dá a
                    forma do dia antes da leitura item a item. */}
                <View style={{ marginBottom: spacing.lg }}>
                  <ReguaDia marcacoes={day.punches.map((p) => p.time)} altura={10} />
                  <EixoRegua />
                </View>

                {day.punches.map((punch, index) => (
                  <TimelineRow
                    key={punch.id}
                    time={punch.time}
                    label={labelForKind(punch.kind as PunchKind)}
                    detail={
                      punch.outsideGeofence
                        ? 'Fora das áreas cadastradas'
                        : 'Registrado pelo app'
                    }
                    warn={punch.outsideGeofence}
                    last={index === day.punches.length - 1}
                  />
                ))}
              </Card>
            )}
          </View>

          <PrimaryButton
            label="Solicitar ajuste"
            onPress={() => router.push(`/nova-solicitacao?data=${isoDate}`)}
          />
        </View>
      )}
    </Screen>
  );
}

function TimelineRow({
  time,
  label,
  detail,
  warn,
  last,
}: {
  time: string;
  label: string;
  detail: string;
  warn?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {/* Trilho da linha do tempo */}
      <View style={{ alignItems: 'center', width: 14 }}>
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: warn ? c.warn : c.brandAction,
            marginTop: 5,
          }}
        />
        {!last ? <View style={{ flex: 1, width: 2, backgroundColor: c.line }} /> : null}
      </View>

      <View style={{ flex: 1, paddingBottom: last ? 0 : spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
          <Text style={{ color: c.text, fontFamily: fonts.mono, fontSize: 19 }}>{time}</Text>
          <Text style={{ color: c.text2, fontFamily: fonts.semibold, fontSize: 14 }}>
            {label}
          </Text>
        </View>
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 1 }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'bad' | 'muted';
}) {
  const { c } = useTheme();
  const ink = tone === 'ok' ? c.brandInk : tone === 'bad' ? c.bad : tone === 'muted' ? c.muted : c.text;

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ color: ink, fontFamily: fonts.mono, fontSize: 22 }}>{value}</Text>
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function summary(day: TimesheetDay): string {
  const tag = dayTag(day);
  return tag.text;
}

function formatDay(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, dayOfMonth] = isoDate.split('-');
  return `${dayOfMonth}/${month}/${year}`;
}

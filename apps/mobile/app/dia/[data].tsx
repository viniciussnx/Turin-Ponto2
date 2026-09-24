import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts } from '../../src/theme/tokens';
import { PrimaryButton, SecondaryButton } from '../../src/components/ui';
import { Aviso, Card, EmptyState, Screen, SectionLabel, StatTile } from '../../src/components/layout';
import { useTimesheet, type TimesheetPunch } from '../../src/api/timesheet';
import { labelForKind } from '../../src/punch/useToday';
import type { PunchKind } from '../../src/punch/queue';

/// Tela 06 do protótipo — detalhe do dia + solicitar ajuste.
export default function DayDetailScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { data: isoDate } = useLocalSearchParams<{ data: string }>();

  // Reaproveita a apuração do mês inteiro: a API não tem rota de dia isolado.
  const month = useMemo(() => new Date(`${isoDate}T12:00:00`), [isoDate]);
  const { data, loading } = useTimesheet(month);
  const day = data?.days.find((item) => item.date === isoDate);

  return (
    <Screen
      title={tituloDoDia(isoDate)}
      headerExtra={
        day ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
            <StatTile label="Trabalhadas" value={day.worked} />
            <StatTile label="Previstas" value={day.expected} />
            <StatTile
              label="Saldo"
              value={day.balanceMinutes === 0 ? '00:00' : comSinal(day.balance, day.balanceMinutes)}
              tone={day.balanceMinutes > 0 ? 'brand' : day.balanceMinutes < 0 ? 'bad' : 'default'}
            />
          </View>
        ) : undefined
      }
      footer={
        day ? (
          <>
            <PrimaryButton
              label="Solicitar ajuste"
              iconName="swap"
              sombra={false}
              onPress={() => router.push(`/nova-solicitacao?data=${isoDate}`)}
            />
            <SecondaryButton
              label="Anexar atestado ou justificativa"
              iconName="doc"
              onPress={() => router.push(`/nova-solicitacao?data=${isoDate}&tipo=JUSTIFY_ABSENCE`)}
            />
          </>
        ) : undefined
      }
    >
      {loading && !day ? (
        <ActivityIndicator color={c.brand} style={{ marginTop: 28 }} />
      ) : !day ? (
        <EmptyState icon="alert" title="Dia não encontrado" />
      ) : (
        <>
          {day.inconsistencies.length > 0 ? (
            <Aviso
              titulo="Divergência de jornada"
              texto={`${day.inconsistencies.map((item) => item.message).join('. ')}. Sujeita a validação do RH.`}
            />
          ) : null}

          <View>
            <SectionLabel style={{ marginBottom: 10 }}>Marcações</SectionLabel>
            {day.punches.length === 0 ? (
              <Card>
                <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 14 }}>
                  {day.isRestDay ? 'Folga programada.' : day.isHoliday ? 'Feriado.' : 'Nenhuma marcação registrada neste dia.'}
                </Text>
              </Card>
            ) : (
              <Card style={{ paddingVertical: 6 }}>
                {day.punches.map((punch, index) => (
                  <LinhaDoTempo key={punch.id} punch={punch} ultima={index === day.punches.length - 1} />
                ))}
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

/// Linha da linha do tempo: hora `700 14px` numa coluna de 52 pt, bolinha
/// de 11 pt com borda `--brand` de 2,5 pt, trilho de 1,5 pt e a etiqueta de
/// origem em versalete.
function LinhaDoTempo({ punch, ultima }: { punch: TimesheetPunch; ultima: boolean }) {
  const { c } = useTheme();
  const fora = punch.outsideGeofence;

  return (
    <View style={{ flexDirection: 'row', gap: 14, paddingVertical: 12 }}>
      <Text style={{ width: 52, paddingTop: 1, color: c.text, fontFamily: fonts.bold, fontSize: 14, letterSpacing: -0.28 }}>
        {punch.time}
      </Text>
      <View style={{ width: 11, alignItems: 'center' }}>
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            borderWidth: 2.5,
            borderColor: fora ? c.warn : c.brand,
            backgroundColor: c.surface,
          }}
        />
        <View style={{ flex: 1, width: 1.5, minHeight: 16, backgroundColor: ultima ? 'transparent' : c.line }} />
      </View>
      <View style={{ flex: 1, paddingBottom: 2 }}>
        <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
          {labelForKind(punch.kind as PunchKind)}
        </Text>
        <Text style={{ marginTop: 2, color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
          {fora ? 'Fora das áreas cadastradas' : 'Dentro da cerca virtual'}
        </Text>
        <View
          style={{
            marginTop: 6,
            alignSelf: 'flex-start',
            height: 22,
            paddingHorizontal: 8,
            borderRadius: 7,
            backgroundColor: c.surface2,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: c.muted, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {fora ? 'App · fora da cerca' : 'App · GPS'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function comSinal(texto: string, minutos: number): string {
  if (/^[+\-−]/.test(texto)) return texto;
  return minutos > 0 ? `+${texto}` : texto;
}

/// "Quarta, 11 de setembro".
function tituloDoDia(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T12:00:00`);
  const semana = date.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  const resto = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${resto}`;
}


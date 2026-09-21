import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { Card, ProvisionalNotice, Screen, SectionLabel } from '../../src/components/layout';
import { getShiftWeek, getWorkedBlocks } from '../../src/api/roster';
import { useTimesheet } from '../../src/api/timesheet';

/// Tela 17 do protótipo — escala prevista × realizada.
///
/// O lado "prevista" é provisório (vem do roster de demonstração); o lado
/// "realizada" é real, apurado das marcações pela API.
export default function ShiftDayScreen() {
  const { c } = useTheme();
  const { data: isoDate } = useLocalSearchParams<{ data: string }>();

  const week = useMemo(() => getShiftWeek(new Date(`${isoDate}T12:00:00`)), [isoDate]);
  const day = week.days.find((item) => item.date === isoDate) ?? week.days[0];

  const month = useMemo(() => new Date(`${isoDate}T12:00:00`), [isoDate]);
  const { data: timesheet } = useTimesheet(month);
  const timesheetDay = timesheet?.days.find((item) => item.date === isoDate);

  const worked =
    timesheetDay && timesheetDay.workedMinutes > 0 ? timesheetDay.worked : null;
  const blocks = getWorkedBlocks(day, worked);

  const [open, setOpen] = useState<string | null>('realizada');

  return (
    <Screen title={`${day.weekday}, ${day.day}`} subtitle={day.shiftName}>
      <View style={{ gap: spacing.lg }}>
        <ProvisionalNotice>
          A escala prevista é de demonstração. O bloco &quot;realizada&quot; é real,
          apurado das suas marcações.
        </ProvisionalNotice>

        {blocks.map((block) => {
          const expanded = open === block.key;
          const isPlanned = block.key === 'prevista';

          return (
            <Card key={block.key} highlighted={expanded}>
              <Pressable
                onPress={() => setOpen(expanded ? null : block.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 16 }}>
                    {block.title}
                  </Text>
                  <Text
                    style={{
                      color: c.muted,
                      fontFamily: fonts.regular,
                      fontSize: 13,
                      marginTop: 1,
                    }}
                  >
                    {block.subtitle}
                  </Text>
                </View>

                <Text
                  style={{
                    color: block.empty ? c.muted : isPlanned ? c.text : c.brandInk,
                    fontFamily: fonts.display,
                    fontSize: 24,
                  }}
                >
                  {block.total}
                </Text>
                <Icon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  color={c.muted}
                  size={20}
                />
              </Pressable>

              {expanded ? (
                <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
                  {block.periods.length > 0 ? (
                    block.periods.map((period) => (
                      <View
                        key={period.label}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
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
                          <Icon name={period.icon} color={c.text2} size={18} />
                        </View>
                        <Text
                          style={{ flex: 1, color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}
                        >
                          {period.label}
                        </Text>
                        <Text
                          style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}
                        >
                          {period.window}
                        </Text>
                      </View>
                    ))
                  ) : block.key === 'realizada' && timesheetDay?.punches.length ? (
                    <View style={{ gap: spacing.sm }}>
                      <SectionLabel>Marcações do dia</SectionLabel>
                      {timesheetDay.punches.map((punch) => (
                        <View
                          key={punch.id}
                          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                        >
                          <Text
                            style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}
                          >
                            Marcação
                          </Text>
                          <Text
                            style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}
                          >
                            {punch.time}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: c.muted,
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {isPlanned
                        ? 'Nenhuma jornada prevista para este dia.'
                        : 'Ainda sem marcações apuradas neste dia.'}
                    </Text>
                  )}
                </View>
              ) : null}
            </Card>
          );
        })}

        {timesheetDay && timesheetDay.balanceMinutes !== 0 ? (
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>
                Diferença do dia
              </Text>
              <Text
                style={{
                  color: timesheetDay.balanceMinutes > 0 ? c.brandInk : c.bad,
                  fontFamily: fonts.display,
                  fontSize: 22,
                }}
              >
                {timesheetDay.balance}
              </Text>
            </View>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../src/theme/tokens';
import { Icon, type IconName } from '../src/components/Icon';
import {
  Card,
  ListRow,
  ProvisionalNotice,
  Screen,
  SectionLabel,
  Tag,
} from '../src/components/layout';
import { getShiftWeek, type ShiftDay } from '../src/api/roster';

/// Tela 11 do protótipo — escala da semana.
export default function EscalaScreen() {
  const { c } = useTheme();
  const router = useRouter();

  const week = useMemo(() => getShiftWeek(), []);
  const today = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState(
    () => week.days.find((day) => day.date === today)?.date ?? week.days[0].date,
  );

  const day = week.days.find((item) => item.date === selected) ?? week.days[0];
  const upcoming = week.days.filter((item) => item.date > today).slice(0, 3);

  return (
    <Screen title="Minha escala" subtitle={week.scheduleName}>
      <View style={{ gap: spacing.lg }}>
        <ProvisionalNotice>
          Escala de demonstração. Turno, linha e veículo ainda não vêm do servidor — o
          Alterdata não expõe esses dados hoje.
        </ProvisionalNotice>

        {/* Régua da semana */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {week.days.map((item) => {
            const active = item.date === selected;
            const isOff = item.shiftCode === 'F';
            return (
              <Pressable
                key={item.date}
                onPress={() => setSelected(item.date)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: active ? c.brandAction : c.surface,
                  borderWidth: 1,
                  borderColor: active ? c.brandAction : c.line,
                  gap: 3,
                }}
              >
                <Text
                  style={{
                    color: active ? 'rgba(255,255,255,0.8)' : c.muted,
                    fontFamily: fonts.medium,
                    fontSize: 10,
                  }}
                >
                  {item.weekday}
                </Text>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : c.text,
                    fontFamily: fonts.display,
                    fontSize: 17,
                  }}
                >
                  {item.day}
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: isOff ? c.muted : active ? '#FFFFFF' : c.brand,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        <DayCard day={day} onOpen={() => router.push(`/escala/${day.date}`)} />

        {upcoming.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionLabel>Próximos dias</SectionLabel>
            <Card style={{ paddingVertical: spacing.xs }}>
              {upcoming.map((item, index) => (
                <View key={item.date}>
                  <ListRow
                    icon={item.shiftCode === 'F' ? 'coffee' : 'bus'}
                    title={`${item.weekday}, ${item.day} · ${item.shiftName}`}
                    subtitle={
                      item.window
                        ? `${item.window} · Linha ${item.line} · veículo ${item.vehicle}`
                        : 'Folga programada'
                    }
                    iconTone={item.shiftCode === 'F' ? 'neutral' : 'brand'}
                    onPress={() => router.push(`/escala/${item.date}`)}
                  />
                  {index < upcoming.length - 1 ? (
                    <View style={{ height: 1, backgroundColor: c.line2, marginLeft: 50 }} />
                  ) : null}
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function DayCard({ day, onOpen }: { day: ShiftDay; onOpen: () => void }) {
  const { c } = useTheme();
  const isOff = day.shiftCode === 'F';

  const details: { label: string; value: string; icon: IconName }[] = isOff
    ? []
    : [
        { label: 'Linha', value: day.line ?? '—', icon: 'bus' },
        { label: 'Veículo', value: `Prefixo ${day.vehicle ?? '—'}`, icon: 'bus' },
        { label: 'Intervalo', value: day.breakWindow ?? '—', icon: 'coffee' },
        { label: 'Saída', value: day.origin ?? '—', icon: 'pin' },
      ];

  return (
    <Card highlighted>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View>
          <Text style={{ color: c.text, fontFamily: fonts.display, fontSize: 24 }}>
            {day.shiftName}
          </Text>
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 }}>
            {day.window ?? 'Sem jornada prevista'}
          </Text>
        </View>
        <Tag text={isOff ? 'Folga' : day.shiftCode} tone={isOff ? 'neutral' : 'ok'} />
      </View>

      {details.length > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {details.map((detail) => (
            <View
              key={detail.label}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <Icon name={detail.icon} color={c.muted} size={19} />
              <Text style={{ flex: 1, color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>
                {detail.label}
              </Text>
              <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
                {detail.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable onPress={onOpen} hitSlop={8} style={{ marginTop: spacing.lg }}>
        <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 14 }}>
          Ver prevista × realizada ›
        </Text>
      </Pressable>
    </Card>
  );
}

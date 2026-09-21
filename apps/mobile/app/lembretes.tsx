import { Text, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../src/theme/tokens';
import { Card, ProvisionalNotice, Screen, SectionLabel, Toggle } from '../src/components/layout';
import { useReminders, weekdaysLabel } from '../src/prefs/usePreferences';

/// Tela 14 do protótipo — lembretes de ponto.
///
/// São alarmes locais do aparelho, não notificações do servidor: o app sabe o
/// horário da jornada e avisa alguns minutos antes. Funciona offline, que é
/// justamente quando mais importa.
export default function RemindersScreen() {
  const { c } = useTheme();
  const { reminders, toggle } = useReminders();

  return (
    <Screen title="Lembretes" subtitle="Avisos antes de cada marcação">
      <View style={{ gap: spacing.lg }}>
        <ProvisionalNotice>
          Os horários seguem a jornada padrão. Quando a escala vier do servidor, cada
          lembrete passa a acompanhar o turno do dia automaticamente.
        </ProvisionalNotice>

        <View style={{ gap: spacing.sm }}>
          <SectionLabel>Meus lembretes</SectionLabel>
          {reminders.map((reminder) => (
            <Card
              key={reminder.id}
              highlighted={reminder.enabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
              }}
            >
              <View
                style={{
                  minWidth: 68,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: reminder.enabled ? c.brandSoft : c.surface2,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: reminder.enabled ? c.brandInk : c.muted,
                    fontFamily: fonts.display,
                    fontSize: 21,
                  }}
                >
                  {reminder.time}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>
                  {reminder.label}
                </Text>
                <Text
                  style={{
                    color: c.muted,
                    fontFamily: fonts.regular,
                    fontSize: 13,
                    marginTop: 1,
                  }}
                >
                  {weekdaysLabel(reminder.weekdays)}
                </Text>
              </View>

              <Toggle value={reminder.enabled} onChange={() => toggle(reminder.id)} />
            </Card>
          ))}
        </View>

        <Text
          style={{
            color: c.muted,
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
            textAlign: 'center',
          }}
        >
          Os lembretes ficam neste aparelho. Ao trocar de celular, é preciso ligá-los de novo.
        </Text>
      </View>
    </Screen>
  );
}

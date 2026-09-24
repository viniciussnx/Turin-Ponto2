import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts } from '../src/theme/tokens';
import { Icon } from '../src/components/Icon';
import { IconButton } from '../src/components/ui';
import { Aviso, Toggle } from '../src/components/layout';
import { useReminders, weekdaysLabel, type Reminder } from '../src/prefs/usePreferences';

/// Tela 14 do protótipo — lembretes com interruptores funcionais.
///
/// São alarmes locais do aparelho, não notificações do servidor: funcionam
/// offline, que é justamente quando mais importa.
export default function RemindersScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reminders, toggle, setTime, add, remove } = useReminders();
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <IconButton name="chevron-left" label="Voltar" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={{ color: c.text, fontFamily: fonts.bold, fontSize: 22, letterSpacing: -0.44 }}>
          Lembretes
        </Text>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
        <Aviso tom="brand" icon="bell" texto="Avisamos 2 minutos antes de cada marcação prevista na sua escala." />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 11 }}>
        {reminders.map((reminder) => (
          <Cartao
            key={reminder.id}
            reminder={reminder}
            aberto={aberto === reminder.id}
            onAbrir={() => setAberto((atual) => (atual === reminder.id ? null : reminder.id))}
            onToggle={() => toggle(reminder.id)}
            onHorario={(hora) => setTime(reminder.id, hora)}
            onRemover={() => {
              setAberto(null);
              remove(reminder.id);
            }}
          />
        ))}
      </ScrollView>

      <View style={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 14) + 16, alignItems: 'flex-end' }}>
        <Pressable
          onPress={() => add()}
          accessibilityRole="button"
          accessibilityLabel="Adicionar lembrete"
          style={({ pressed }) => ({
            height: 54,
            paddingHorizontal: 24,
            borderRadius: 27,
            backgroundColor: pressed ? c.brandActionPressed : c.brand,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            shadowColor: '#0BAF29',
            shadowOpacity: 0.5,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 12 },
            elevation: 6,
          })}
        >
          <Icon name="plus" color="#FFFFFF" size={20} strokeWidth={2.4} />
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Adicionar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Cartao({
  reminder,
  aberto,
  onAbrir,
  onToggle,
  onHorario,
  onRemover,
}: {
  reminder: Reminder;
  aberto: boolean;
  onAbrir: () => void;
  onToggle: () => void;
  onHorario: (hora: string) => void;
  onRemover: () => void;
}) {
  const { c } = useTheme();
  const on = reminder.enabled;
  // No Android o seletor é um diálogo do sistema: abre uma vez e fecha sozinho.
  const [dialogo, setDialogo] = useState(false);
  const android = Platform.OS === 'android';
  const [h, m] = reminder.time.split(':').map(Number);
  const valor = new Date();
  valor.setHours(h ?? 0, m ?? 0, 0, 0);

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: on ? c.brandLine : c.line2,
        borderRadius: 18,
        paddingVertical: 15,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ flex: 1, color: on ? c.brandInk : c.muted, fontFamily: fonts.bold, fontSize: 25, lineHeight: 27, letterSpacing: -0.5 }}>
          {reminder.time}
        </Text>
        <Toggle value={on} onChange={onToggle} label={`Lembrete de ${reminder.label} às ${reminder.time}`} />
      </View>

      <Pressable
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel={aberto ? 'Fechar opções' : 'Alterar horário'}
        style={{ marginTop: 9, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line2, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Text style={{ flex: 1, color: c.text2, fontFamily: fonts.medium, fontSize: 13 }}>{weekdaysLabel(reminder.weekdays)}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase' }}>
          {reminder.label}
        </Text>
        <Icon name={aberto ? 'chevron-up' : 'chevron-down'} color={c.text} size={17} strokeWidth={1.9} />
      </Pressable>

      {aberto ? (
        <View style={{ marginTop: 10, gap: 10 }}>
          {android ? (
            <Pressable onPress={() => setDialogo(true)} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 13 }}>Alterar horário</Text>
            </Pressable>
          ) : null}
          {!android || dialogo ? (
          <DateTimePicker
            value={valor}
            mode="time"
            is24Hour
            locale="pt-BR"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(evento, escolhido) => {
              setDialogo(false);
              if (evento.type === 'dismissed' || !escolhido) return;
              onHorario(
                `${String(escolhido.getHours()).padStart(2, '0')}:${String(escolhido.getMinutes()).padStart(2, '0')}`,
              );
            }}
          />
          ) : null}
          <Pressable onPress={onRemover} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
            <Text style={{ color: c.bad, fontFamily: fonts.semibold, fontSize: 13 }}>Excluir lembrete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

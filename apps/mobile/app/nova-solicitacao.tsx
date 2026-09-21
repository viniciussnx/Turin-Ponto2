import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../src/theme/tokens';
import { PrimaryButton } from '../src/components/ui';
import { Card, Screen, SectionLabel } from '../src/components/layout';
import {
  TYPE_LABEL,
  createAdjustment,
  formatDate,
  type AdjustmentType,
} from '../src/api/adjustments';
import { DAY_SLOTS } from '../src/punch/useToday';

const TYPES: AdjustmentType[] = ['ADD', 'CHANGE_TIME', 'JUSTIFY_ABSENCE'];

/// Tela 15 do protótipo — abertura de solicitação, com a régua de dias.
///
/// `REMOVE` fica de fora da lista: excluir marcação exige apontar qual, e isso
/// se faz pelo detalhe do dia, onde a marcação está à vista.
export default function NewAdjustmentScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string }>();

  const days = useMemo(() => lastDays(14), []);
  const [date, setDate] = useState(params.data ?? days[days.length - 1].iso);
  const [type, setType] = useState<AdjustmentType>('ADD');
  const [time, setTime] = useState('');
  const [kind, setKind] = useState<string>('CLOCK_IN');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const needsTime = type === 'ADD' || type === 'CHANGE_TIME';
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const canSubmit = reason.trim().length >= 5 && (!needsTime || validTime) && !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await createAdjustment({
        type,
        localDate: date,
        reason: reason.trim(),
        // O horário vai como instante completo: o servidor precisa do momento,
        // não só do relógio. Montamos a partir do dia escolhido, no fuso local.
        proposedAt: needsTime ? new Date(`${date}T${time}:00`).toISOString() : undefined,
        proposedKind: needsTime ? kind : undefined,
      });
      router.back();
    } catch (failure) {
      Alert.alert('Não foi possível enviar', (failure as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Nova solicitação" subtitle="O RH analisa e responde pelo app">
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>Dia de referência</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}
          >
            {days.map((day) => {
              const active = day.iso === date;
              return (
                <Pressable
                  key={day.iso}
                  onPress={() => setDate(day.iso)}
                  style={{
                    width: 56,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                    borderRadius: radius.md,
                    backgroundColor: active ? c.brand : c.surface,
                    borderWidth: 1,
                    borderColor: active ? c.brand : c.line,
                  }}
                >
                  <Text
                    style={{
                      color: active ? 'rgba(255,255,255,0.82)' : c.muted,
                      fontFamily: fonts.medium,
                      fontSize: 11,
                    }}
                  >
                    {day.weekday}
                  </Text>
                  <Text
                    style={{
                      color: active ? '#FFFFFF' : c.text,
                      fontFamily: fonts.display,
                      fontSize: 20,
                    }}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={{
                      color: active ? 'rgba(255,255,255,0.82)' : c.muted,
                      fontFamily: fonts.regular,
                      fontSize: 10,
                    }}
                  >
                    {day.month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 13 }}>
            Selecionado: {formatDate(date)}
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <SectionLabel>Tipo de pedido</SectionLabel>
          {TYPES.map((option) => (
            <Pressable
              key={option}
              onPress={() => setType(option)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: c.surface,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: type === option ? c.brand : c.line,
                padding: spacing.md,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: type === option ? c.brand : c.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {type === option ? (
                  <View
                    style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.brand }}
                  />
                ) : null}
              </View>
              <Text style={{ color: c.text, fontFamily: fonts.medium, fontSize: 15 }}>
                {TYPE_LABEL[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        {needsTime ? (
          <Card style={{ gap: spacing.md }}>
            <SectionLabel>Horário correto</SectionLabel>
            <TextInput
              value={time}
              onChangeText={(value) => setTime(maskTime(value))}
              placeholder="00:00"
              placeholderTextColor={c.muted}
              keyboardType="number-pad"
              maxLength={5}
              style={{
                color: c.text,
                fontFamily: fonts.display,
                fontSize: 34,
                letterSpacing: 1,
                paddingVertical: spacing.sm,
              }}
            />
            {time.length === 5 && !validTime ? (
              <Text style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 13 }}>
                Horário inválido
              </Text>
            ) : null}

            <SectionLabel>Qual marcação</SectionLabel>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {DAY_SLOTS.map((slot) => {
                const active = kind === slot.kind;
                return (
                  <Pressable
                    key={slot.kind}
                    onPress={() => setKind(slot.kind)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      backgroundColor: active ? c.brand : c.surface2,
                      borderWidth: 1,
                      borderColor: active ? c.brand : c.line,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? '#FFFFFF' : c.text2,
                        fontFamily: fonts.semibold,
                        fontSize: 12,
                      }}
                    >
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <SectionLabel>Justificativa</SectionLabel>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Explique o que aconteceu. O RH lê isso para decidir."
            placeholderTextColor={c.muted}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            style={{
              minHeight: 110,
              backgroundColor: c.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: c.line,
              padding: spacing.md,
              color: c.text,
              fontFamily: fonts.regular,
              fontSize: 15,
              lineHeight: 21,
            }}
          />
          <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
            {reason.trim().length < 5
              ? 'Mínimo de 5 caracteres.'
              : `${reason.length}/500 caracteres`}
          </Text>
        </View>

        <PrimaryButton
          label="ENVIAR SOLICITAÇÃO"
          onPress={submit}
          loading={saving}
          disabled={!canSubmit}
        />
      </View>
    </Screen>
  );
}

/// Régua dos últimos N dias, do mais antigo para hoje.
function lastDays(count: number) {
  const result: { iso: string; day: string; weekday: string; month: string }[] = [];
  const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const months = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    result.push({
      iso: toIsoDay(date),
      day: String(date.getDate()).padStart(2, '0'),
      weekday: weekdays[date.getDay()],
      month: months[date.getMonth()],
    });
  }
  return result;
}

/// Data local em ISO. `toISOString()` converteria para UTC e, à noite, jogaria
/// o dia para o seguinte.
function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function maskTime(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

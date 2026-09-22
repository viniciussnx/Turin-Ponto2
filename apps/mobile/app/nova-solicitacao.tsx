import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../src/theme/tokens';
import { PrimaryButton } from '../src/components/ui';
import { Card, Screen, SectionLabel } from '../src/components/layout';
import { DateTimeField } from '../src/components/DateTimeField';
import {
  TYPE_LABEL,
  createAdjustment,
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

  /*
   * Data e hora saem de seletores nativos, não de uma régua de 14 dias e de
   * um campo mascarado. A régua tornava impossível pedir ajuste sobre um dia
   * fora da janela — um pedido sobre o dia 3 aberto no dia 20 não tinha como
   * ser feito.
   *
   * O estado guarda `Date`; o ISO só é montado na hora de enviar.
   */
  const [quando, setQuando] = useState<Date>(() =>
    params.data ? new Date(`${params.data}T12:00:00`) : new Date(),
  );
  const [horario, setHorario] = useState<Date>(() => new Date());
  const [type, setType] = useState<AdjustmentType>('ADD');
  const [kind, setKind] = useState<string>('CLOCK_IN');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const needsTime = type === 'ADD' || type === 'CHANGE_TIME';
  const canSubmit = reason.trim().length >= 5 && !saving;

  // O ajuste é sempre sobre um dia que já passou; o seletor não deixa escolher
  // o futuro, em vez de aceitar e o servidor recusar depois.
  const hoje = useMemo(() => new Date(), []);

  const dataIso = useMemo(() => isoLocal(quando), [quando]);

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      // O instante combina o DIA escolhido no primeiro seletor com a HORA do
      // segundo — os dois seletores editam campos diferentes do mesmo momento.
      const instante = new Date(quando);
      instante.setHours(horario.getHours(), horario.getMinutes(), 0, 0);

      await createAdjustment({
        type,
        localDate: dataIso,
        reason: reason.trim(),
        proposedAt: needsTime ? instante.toISOString() : undefined,
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
        {/* Seletor nativo: alcança qualquer dia passado, traz o calendário,
            o formato local e o leitor de tela sem código nosso. */}
        <DateTimeField
          label="Dia de referência"
          modo="date"
          valor={quando}
          onChange={setQuando}
          maximo={hoje}
        />
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
                borderColor: type === option ? c.brandAction : c.line,
                padding: spacing.md,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: type === option ? c.brandAction : c.line,
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
            {/* Seletor nativo no lugar do campo mascarado: não há estado
                inválido possível, e o formato de 24 h vem do sistema. */}
            <DateTimeField
              label="Horário correto"
              modo="time"
              valor={horario}
              onChange={setHorario}
            />

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
                      backgroundColor: active ? c.brandAction : c.surface2,
                      borderWidth: 1,
                      borderColor: active ? c.brandAction : c.line,
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




/// Data em ISO local (YYYY-MM-DD), sem passar por UTC.
///
/// `toISOString().slice(0,10)` erraria o dia para quem está a oeste de
/// Greenwich em qualquer horário depois das 21h — o que num app de ponto
/// significa atribuir a marcação ao dia seguinte.
function isoLocal(valor: Date): string {
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${valor.getFullYear()}-${mes}-${dia}`;
}

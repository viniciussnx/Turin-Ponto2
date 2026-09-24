import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius } from '../src/theme/tokens';
import { Field, PrimaryButton } from '../src/components/ui';
import { Card, ChipFilters, IconChip, Screen, SectionLabel } from '../src/components/layout';
import { DateTimeField } from '../src/components/DateTimeField';
import { Icon } from '../src/components/Icon';
import { TYPE_LABEL, createAdjustment, typeIcon, type AdjustmentType } from '../src/api/adjustments';
import { DAY_SLOTS } from '../src/punch/useToday';

const TYPES: AdjustmentType[] = ['ADD', 'CHANGE_TIME', 'JUSTIFY_ABSENCE'];

const DESCRICAO: Record<AdjustmentType, string> = {
  ADD: 'Esqueci de bater uma marcação',
  CHANGE_TIME: 'Uma marcação ficou com o horário errado',
  JUSTIFY_ABSENCE: 'Atestado, falta ou justificativa do dia',
  REMOVE: 'Excluir uma marcação',
};

/// Abertura de solicitação (ajuste, inclusão ou abono). O protótipo não tem
/// artboard própria para esta tela; ela segue o idioma das telas 06 e 07.
///
/// `REMOVE` fica de fora da lista: excluir marcação exige apontar qual, e isso
/// se faz pelo detalhe do dia, onde a marcação está à vista.
export default function NewAdjustmentScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; tipo?: AdjustmentType }>();

  const [quando, setQuando] = useState<Date>(() => (params.data ? new Date(`${params.data}T12:00:00`) : new Date()));
  const [horario, setHorario] = useState<Date>(() => new Date());
  const [type, setType] = useState<AdjustmentType>(() =>
    params.tipo && TYPES.includes(params.tipo) ? params.tipo : 'ADD',
  );
  const [kind, setKind] = useState<string>('Entrada');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const needsTime = type === 'ADD' || type === 'CHANGE_TIME';
  const canSubmit = reason.trim().length >= 5 && !saving;
  // O ajuste é sempre sobre um dia que já passou.
  const hoje = useMemo(() => new Date(), []);

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      // O instante combina o DIA do primeiro seletor com a HORA do segundo.
      const instante = new Date(quando);
      instante.setHours(horario.getHours(), horario.getMinutes(), 0, 0);
      const slot = DAY_SLOTS.find((item) => item.label === kind);

      await createAdjustment({
        type,
        localDate: isoLocal(quando),
        reason: reason.trim(),
        proposedAt: needsTime ? instante.toISOString() : undefined,
        proposedKind: needsTime ? slot?.kind : undefined,
      });
      router.back();
    } catch (failure) {
      Alert.alert('Não foi possível enviar', (failure as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title="Nova solicitação"
      footer={<PrimaryButton label="Enviar solicitação" iconName="check" onPress={submit} loading={saving} disabled={!canSubmit} sombra={false} />}
    >
      <DateTimeField label="Dia de referência" modo="date" valor={quando} onChange={setQuando} maximo={hoje} />

      <View style={{ gap: 9 }}>
        <SectionLabel style={{ marginBottom: 1 }}>Tipo de pedido</SectionLabel>
        {TYPES.map((option) => {
          const ativo = type === option;
          return (
            <Pressable
              key={option}
              onPress={() => setType(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderRadius: radius.xl,
                backgroundColor: c.surface,
                borderWidth: ativo ? 1.5 : 1,
                borderColor: ativo ? c.brand : c.line2,
              }}
            >
              <IconChip icon={typeIcon(option)} tone={ativo ? 'ok' : 'neutral'} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{TYPE_LABEL[option]}</Text>
                <Text style={{ marginTop: 1, color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>{DESCRICAO[option]}</Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: ativo ? 0 : 1.5,
                  borderColor: c.line,
                  backgroundColor: ativo ? c.brand : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ativo ? <Icon name="check" color="#FFFFFF" size={14} strokeWidth={2.6} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {needsTime ? (
        <Card style={{ gap: 14 }}>
          <DateTimeField label="Horário correto" modo="time" valor={horario} onChange={setHorario} />
          <View style={{ gap: 9 }}>
            <SectionLabel style={{ marginHorizontal: 0 }}>Qual marcação</SectionLabel>
            <ChipFilters options={DAY_SLOTS.map((slot) => slot.label)} value={kind} onChange={setKind} />
          </View>
        </Card>
      ) : null}

      <View>
        <Field
          label="Justificativa"
          value={reason}
          onChangeText={setReason}
          placeholder="Explique o que aconteceu. O RH lê isso para decidir."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={{ marginTop: 8, marginHorizontal: 4, color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
          {reason.trim().length < 5 ? 'Mínimo de 5 caracteres.' : `${reason.length}/500 caracteres`}
        </Text>
      </View>
    </Screen>
  );
}

/// Data em ISO local (YYYY-MM-DD), sem passar por UTC — `toISOString()`
/// erraria o dia para quem está a oeste de Greenwich depois das 21h.
function isoLocal(valor: Date): string {
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${valor.getFullYear()}-${mes}-${dia}`;
}

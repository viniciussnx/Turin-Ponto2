import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius, spacing, MIN_TOQUE } from '../theme/tokens';
import { useScale } from '../theme/useScale';
import { Icon } from './Icon';

/*
 * Campo de data e de hora usando o seletor NATIVO.
 *
 * O que havia antes:
 *  - a data era uma régua horizontal de 14 dias. Um pedido de ajuste sobre o
 *    dia 3 aberto no dia 20 era impossível de selecionar — a régua não
 *    alcançava, e não havia outro caminho.
 *  - a hora era um `TextInput` com máscara, validado por regex. Digitar
 *    "07:4" deixava o campo num estado inválido silencioso, e quem usa
 *    VoiceOver não tinha como saber o formato esperado.
 *
 * `pickers.md` é direto: *"use a picker to provide a fixed set of choices…
 * people are familiar with the standard date picker."* O seletor do sistema
 * traz o calendário, o formato local, o Dynamic Type, o leitor de tela e o
 * teclado — tudo de graça e sem a nossa regex.
 *
 * No iOS o seletor fica inline, aberto no lugar; no Android ele é um diálogo
 * modal do próprio sistema, que fecha sozinho. Daí o `mostrar` ser desligado
 * no `onChange` só no Android.
 */
export function DateTimeField({
  label,
  modo,
  valor,
  onChange,
  minimo,
  maximo,
  hint,
}: {
  label: string;
  modo: 'date' | 'time';
  valor: Date;
  onChange: (valor: Date) => void;
  minimo?: Date;
  maximo?: Date;
  hint?: string;
}) {
  const { c } = useTheme();
  const { alturaMin } = useScale();
  const [mostrar, setMostrar] = useState(false);

  const textoValor =
    modo === 'date'
      ? valor.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : valor.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: c.text2 }}>{label}</Text>

      <Pressable
        onPress={() => setMostrar((atual) => !atual)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${textoValor}`}
        accessibilityHint={
          modo === 'date' ? 'Toque para escolher outra data' : 'Toque para escolher outro horário'
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          backgroundColor: c.surface2,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: mostrar ? c.brandAction : c.line,
          paddingHorizontal: spacing.md,
          minHeight: Math.max(alturaMin(52), MIN_TOQUE),
        }}
      >
        <Text
          style={{
            flex: 1,
            color: c.text,
            fontFamily: modo === 'time' ? fonts.mono : fonts.medium,
            fontSize: 16,
          }}
        >
          {textoValor}
        </Text>
        <Icon name={modo === 'date' ? 'calendar' : 'clock'} color={c.muted} size={20} />
      </Pressable>

      {hint ? (
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>{hint}</Text>
      ) : null}

      {mostrar ? (
        <DateTimePicker
          value={valor}
          mode={modo}
          display={Platform.OS === 'ios' ? (modo === 'date' ? 'inline' : 'spinner') : 'default'}
          minimumDate={minimo}
          maximumDate={maximo}
          locale="pt-BR"
          is24Hour
          onChange={(evento, escolhido) => {
            // No Android o diálogo é do sistema e some ao confirmar ou cancelar.
            if (Platform.OS === 'android') setMostrar(false);
            if (evento.type === 'dismissed' || !escolhido) return;
            onChange(escolhido);
          }}
        />
      ) : null}
    </View>
  );
}

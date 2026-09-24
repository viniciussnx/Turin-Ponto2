import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { eyebrow, fonts } from '../../src/theme/tokens';
import { Icon, type IconName } from '../../src/components/Icon';
import { IconButton, PrimaryButton } from '../../src/components/ui';
import { Aviso } from '../../src/components/layout';
import { getShiftWeek } from '../../src/api/roster';
import { useTimesheet, type TimesheetDay } from '../../src/api/timesheet';

/// Quantos dias a faixa "Dias disponíveis" mostra de uma vez.
const JANELA = 5;

/// Tela 17 do protótipo — escala prevista × realizada, em acordeão.
///
/// O lado "prevista" vem do roster de demonstração; o "realizada" é real,
/// apurado das marcações pela API.
export default function JornadaDoDiaScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: isoInicial } = useLocalSearchParams<{ data: string }>();

  const [iso, setIso] = useState(isoInicial);
  const [aberto, setAberto] = useState<'prevista' | 'realizada' | null>('realizada');

  const data = useMemo(() => new Date(`${iso}T12:00:00`), [iso]);
  const hojeIso = isoDia(new Date());

  // A faixa termina no dia que abriu a tela.
  const [fimJanela, setFimJanela] = useState(isoInicial);
  const dias = useMemo(() => {
    const fim = new Date(`${fimJanela}T12:00:00`);
    return Array.from({ length: JANELA }, (_, i) => {
      const d = new Date(fim);
      d.setDate(fim.getDate() - (JANELA - 1 - i));
      return d;
    });
  }, [fimJanela]);

  const turno = useMemo(() => getShiftWeek(data).days.find((d) => d.date === iso), [data, iso]);
  const { data: espelho } = useTimesheet(data);
  const diaApurado = espelho?.days.find((d) => d.date === iso);
  const emAndamento = iso === hojeIso && (diaApurado?.punches.length ?? 0) % 2 === 1;

  const periodosPrevistos: Periodo[] = turno?.window
    ? [
        { label: 'Jornada', faixa: turno.window, icon: 'clock' },
        ...(turno.breakWindow ? [{ label: 'Intervalo', faixa: turno.breakWindow, icon: 'coffee' as const }] : []),
        ...(turno.line ? [{ label: 'Linha prevista', faixa: turno.line, icon: 'bus' as const }] : []),
      ]
    : [];
  const periodosRealizados = pares(diaApurado);

  function andar(delta: number) {
    const fim = new Date(`${fimJanela}T12:00:00`);
    fim.setDate(fim.getDate() + delta * JANELA);
    setFimJanela(isoDia(fim));
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <IconButton name="chevron-left" label="Voltar" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={{ flex: 1, color: c.text, fontFamily: fonts.semibold, fontSize: 17 }}>
          Jornada do dia
        </Text>
      </View>

      {/* Dias disponíveis */}
      <View style={{ backgroundColor: c.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 14 }}>
        <Text style={{ ...eyebrow(c.muted), textAlign: 'center', marginBottom: 11 }}>Dias disponíveis</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable onPress={() => andar(-1)} hitSlop={10} accessibilityLabel="Dias anteriores" style={{ width: 24, alignItems: 'center' }}>
            <Icon name="chevron-left" color={c.muted} size={18} strokeWidth={2} />
          </Pressable>
          {dias.map((d) => {
            const diaIso = isoDia(d);
            const on = diaIso === iso;
            const sub = on ? 'rgba(255,255,255,0.82)' : c.muted;
            return (
              <Pressable
                key={diaIso}
                onPress={() => setIso(diaIso)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  flex: 1,
                  paddingTop: 9,
                  paddingBottom: 8,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: on ? c.brand : 'transparent',
                  borderWidth: 1,
                  borderColor: on ? c.brand : 'transparent',
                }}
              >
                <Text style={{ color: sub, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.8 }}>
                  {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                </Text>
                <Text style={{ marginVertical: 1, color: on ? '#FFFFFF' : c.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 19, letterSpacing: -0.36 }}>
                  {String(d.getDate()).padStart(2, '0')}
                </Text>
                <Text style={{ color: sub, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.6 }}>
                  {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => andar(1)} hitSlop={10} accessibilityLabel="Próximos dias" style={{ width: 24, alignItems: 'center' }}>
            <Icon name="chevron-right" color={c.muted} size={18} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        {emAndamento ? (
          <Aviso titulo="Atenção" texto="A jornada em andamento pode levar alguns minutos para atualizar os dados." />
        ) : null}

        <Bloco
          titulo="Escala prevista"
          sub={turno?.window ? `Dia trabalhado · ${turno.shiftName}` : 'Folga programada'}
          tempo={turno?.window ? duracao(turno.window) : '—'}
          tempoCor={c.text}
          periodos={periodosPrevistos}
          vazio="Sem jornada prevista"
          aberto={aberto === 'prevista'}
          onToggle={() => setAberto((a) => (a === 'prevista' ? null : 'prevista'))}
        />
        <Bloco
          titulo="Escala realizada"
          sub={emAndamento ? 'Jornada em andamento' : diaApurado?.punches.length ? 'Apurado pelas marcações' : 'Sem marcações'}
          tempo={diaApurado && diaApurado.workedMinutes > 0 ? diaApurado.worked : '--:--'}
          tempoCor={diaApurado && diaApurado.workedMinutes > 0 ? c.text : c.muted}
          periodos={periodosRealizados}
          vazio="Nenhum período realizado"
          aberto={aberto === 'realizada'}
          onToggle={() => setAberto((a) => (a === 'realizada' ? null : 'realizada'))}
        />

        <Text style={{ textAlign: 'center', color: c.muted, fontFamily: fonts.regular, fontSize: 11.5 }}>
          A escala prevista é de demonstração; a realizada vem das suas marcações.
        </Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 14) + 16 }}>
        <PrimaryButton label="Solicitar ajuste" iconName="swap" altura={56} onPress={() => router.push(`/nova-solicitacao?data=${iso}`)} />
      </View>
    </View>
  );
}

interface Periodo {
  label: string;
  faixa: string;
  icon: IconName;
}

function Bloco({
  titulo,
  sub,
  tempo,
  tempoCor,
  periodos,
  vazio,
  aberto,
  onToggle,
}: {
  titulo: string;
  sub: string;
  tempo: string;
  tempoCor: string;
  periodos: Periodo[];
  vazio: string;
  aberto: boolean;
  onToggle: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: aberto ? c.brandLine : c.line2, borderRadius: 18, overflow: 'hidden' }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16, minHeight: 64 }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 16 }}>{titulo}</Text>
          <Text style={{ marginTop: 1, color: c.muted, fontFamily: fonts.regular, fontSize: 12.5 }}>{sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ ...eyebrow(c.muted, 9.5), letterSpacing: 1.14 }}>tempo</Text>
          <Text style={{ color: tempoCor, fontFamily: fonts.bold, fontSize: 16, lineHeight: 17, letterSpacing: -0.32 }}>{tempo}</Text>
        </View>
        <Icon name={aberto ? 'chevron-up' : 'chevron-down'} color={c.text} size={20} strokeWidth={2} />
      </Pressable>
      {aberto ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: c.line2 }}>
          {periodos.length === 0 ? (
            <Text style={{ paddingTop: 20, paddingBottom: 6, textAlign: 'center', color: c.muted, fontFamily: fonts.medium, fontSize: 13.5 }}>
              {vazio}
            </Text>
          ) : (
            periodos.map((p, i) => (
              <View
                key={`${p.label}-${i}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: i === periodos.length - 1 ? 0 : 1,
                  borderBottomColor: c.line,
                  borderStyle: 'dashed',
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={p.icon} color={c.brandInk} size={15} strokeWidth={2} />
                </View>
                <Text style={{ flex: 1, color: c.text2, fontFamily: fonts.medium, fontSize: 13 }}>{p.label}</Text>
                <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 14, letterSpacing: -0.28 }}>{p.faixa}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

/// Marcações do dia em pares entrada→saída: "06:40 – 11:38", "12:39 – …".
function pares(dia: TimesheetDay | undefined): Periodo[] {
  if (!dia) return [];
  const horas = dia.punches.map((p) => p.time);
  const lista: Periodo[] = [];
  for (let i = 0; i < horas.length; i += 2) {
    lista.push({
      label: i === 0 ? 'Primeiro período' : i === 2 ? 'Segundo período' : `Período ${i / 2 + 1}`,
      faixa: horas[i + 1] ? `${horas[i]} – ${horas[i + 1]}` : `${horas[i]} – em aberto`,
      icon: horas[i + 1] ? 'clock' : 'alert',
    });
  }
  return lista;
}

/// "06:40 – 15:20" → "08:40" (descontando 1 h de intervalo).
function duracao(janela: string): string {
  const [ini, fim] = janela.split('–').map((parte) => parte.trim());
  const minutos = (valor: string) => {
    const [h, m] = valor.split(':').map(Number);
    return h * 60 + m;
  };
  const total = minutos(fim) - minutos(ini) - 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function isoDia(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { eyebrow, fonts } from '../../src/theme/tokens';
import { Icon, type IconName } from '../../src/components/Icon';
import { SecondaryButton } from '../../src/components/ui';
import { SectionLabel, TopBar } from '../../src/components/layout';
import { getShiftWeek, type ShiftDay } from '../../src/api/roster';

/// Tela 11 do protótipo — escala: turno, linha e veículo.
export default function EscalaScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const hoje = useMemo(() => new Date(), []);
  const week = useMemo(() => getShiftWeek(hoje), [hoje]);
  const hojeIso = isoDia(hoje);

  const [selecionado, setSelecionado] = useState(() => Math.max(week.days.findIndex((d) => d.date === hojeIso), 0));
  const dia = week.days[selecionado];
  const proximos = week.days.slice(selecionado + 1, selecionado + 4);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="Minha escala"
        big
        right={<Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13 }}>{`Semana ${semanaDoAno(hoje)}`}</Text>}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {week.days.map((item, index) => {
            const on = index === selecionado;
            const folga = item.shiftCode === 'F';
            return (
              <Pressable
                key={item.date}
                onPress={() => setSelecionado(index)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${item.weekday}, dia ${item.day}, ${item.shiftName}`}
                style={{
                  flex: 1,
                  paddingTop: 9,
                  paddingBottom: 10,
                  borderRadius: 13,
                  alignItems: 'center',
                  backgroundColor: on ? c.brand : c.surface2,
                  borderWidth: 1,
                  borderColor: on ? c.brand : c.line2,
                }}
              >
                <Text style={{ color: on ? 'rgba(255,255,255,0.8)' : c.muted, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  {item.weekday}
                </Text>
                <Text style={{ marginTop: 2, color: on ? '#FFFFFF' : c.text, fontFamily: fonts.bold, fontSize: 15, lineHeight: 16, letterSpacing: -0.3 }}>
                  {item.day}
                </Text>
                <View style={{ marginTop: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: folga ? c.muted : on ? '#FFFFFF' : c.brand }} />
              </Pressable>
            );
          })}
        </View>
      </TopBar>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, gap: 13 }}>
        {dia ? <CartaoTurno dia={dia} onPress={() => router.push(`/escala/${dia.date}`)} /> : null}

        {proximos.length > 0 ? <SectionLabel style={{ marginBottom: -4 }}>Próximos dias</SectionLabel> : null}
        {proximos.map((item) => (
          <Pressable
            key={item.date}
            onPress={() => router.push(`/escala/${item.date}`)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 13,
              paddingVertical: 13,
              paddingHorizontal: 15,
              borderRadius: 16,
              backgroundColor: pressed ? c.surface2 : c.surface,
              borderWidth: 1,
              borderColor: c.line2,
            })}
          >
            <View style={{ width: 52 }}>
              <Text style={{ color: c.muted, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {item.weekday}
              </Text>
              <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 17, lineHeight: 18, letterSpacing: -0.34 }}>{item.day}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: item.window ? c.text : c.muted, fontFamily: fonts.semibold, fontSize: 14 }}>
                {item.window ? `${item.shiftName} · ${item.window.replace(' – ', '–')}` : 'Folga'}
              </Text>
              <Text style={{ marginTop: 2, color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                {item.line ? `Linha ${item.line} · veículo ${item.vehicle}` : 'Escala 6x1'}
              </Text>
            </View>
          </Pressable>
        ))}

        <Text style={{ marginTop: 2, textAlign: 'center', color: c.muted, fontFamily: fonts.regular, fontSize: 11.5 }}>
          Escala de demonstração: turno, linha e veículo ainda não vêm do servidor.
        </Text>
      </ScrollView>

      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 }}>
        <SecondaryButton
          label="Solicitar troca de folga"
          iconName="swap"
          tom="text"
          altura={52}
          onPress={() =>
            Alert.alert(
              'Troca de folga',
              'A troca é combinada com o seu encarregado. O pedido pelo app ainda não está disponível.',
            )
          }
        />
      </View>
    </View>
  );
}

/// Cartão do dia: borda `--brand-line`, etiqueta "Turno 1", horário de
/// entrada e saída `700 37px` ligados por um traço, e os detalhes com ícone.
function CartaoTurno({ dia, onPress }: { dia: ShiftDay; onPress: () => void }) {
  const { c } = useTheme();
  const [inicio, fim] = (dia.window ?? '').split('–').map((parte) => parte.trim());
  const detalhes: { k: string; v: string; icon: IconName }[] = dia.window
    ? [
        { k: 'Linha', v: dia.line ?? '—', icon: 'bus' },
        { k: 'Veículo', v: dia.vehicle ? `Prefixo ${dia.vehicle}` : '—', icon: 'bus' },
        { k: 'Intervalo', v: dia.breakWindow ?? '—', icon: 'coffee' },
        { k: 'Saída', v: dia.origin ?? '—', icon: 'pin' },
      ]
    : [];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Abre a jornada prevista e realizada do dia"
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: dia.window ? c.brandLine : c.line2,
        borderRadius: 20,
        padding: 18,
        shadowColor: c.shadow,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ height: 27, paddingHorizontal: 11, borderRadius: 9, backgroundColor: dia.window ? c.brandSoft : c.surface2, justifyContent: 'center' }}>
          <Text style={{ color: dia.window ? c.brandInk : c.muted, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' }}>
            {dia.shiftName}
          </Text>
        </View>
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>{dataCurta(dia.date)}</Text>
      </View>

      {dia.window ? (
        <>
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 37, lineHeight: 38, letterSpacing: -0.74 }}>{inicio}</Text>
            <View style={{ flex: 1, height: 2, backgroundColor: c.line, marginBottom: 9 }} />
            <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 37, lineHeight: 38, letterSpacing: -0.74 }}>{fim}</Text>
          </View>
          <View style={{ marginTop: 16, gap: 10 }}>
            {detalhes.map((x) => (
              <View key={x.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <Icon name={x.icon} color={c.text} size={18} />
                <Text style={{ width: 88, ...eyebrow(c.muted, 10), letterSpacing: 1 }}>{x.k}</Text>
                <Text style={{ flex: 1, textAlign: 'right', color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>{x.v}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={{ marginTop: 14, color: c.text, fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.56 }}>Folga programada</Text>
      )}
    </Pressable>
  );
}

function isoDia(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/// "Qui, 12 set".
function dataCurta(isoDate: string): string {
  const texto = new Date(`${isoDate}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')
    .replace(' de ', ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/// Número da semana ISO-8601.
function semanaDoAno(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - inicioAno.getTime()) / 86_400_000 + 1) / 7);
}

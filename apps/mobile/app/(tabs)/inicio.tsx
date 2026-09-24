import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useBarraClara } from '../../src/theme/useBarraClara';
import { eyebrow, fonts, radius } from '../../src/theme/tokens';
import { Avatar, PrimaryButton, TurinLogo } from '../../src/components/ui';
import { Tag } from '../../src/components/layout';
import { Icon, type IconName } from '../../src/components/Icon';
import { DAY_SLOTS, useToday } from '../../src/punch/useToday';
import { useTimesheet } from '../../src/api/timesheet';
import { getShiftWeek } from '../../src/api/roster';

/// Tela 03 do protótipo — home do colaborador.
export default function HomeScreen() {
  const { c } = useTheme();
  useBarraClara();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { employee } = useAuth();
  const { punches, pending, loading, reload } = useToday();

  const [now, setNow] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);
  const ano = now.getFullYear();
  const numeroMes = now.getMonth();
  const mes = useMemo(() => new Date(ano, numeroMes, 1), [ano, numeroMes]);
  const { data: espelho, reload: recarregarEspelho } = useTimesheet(mes);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const hojeIso = toIsoDay(now);
  const escalaHoje = getShiftWeek(now).days.find((day) => day.date === hojeIso);
  const working = punches.length % 2 === 1;

  const saldo = espelho?.totals.balanceMinutes ?? null;
  const progresso = espelho && espelho.totals.expectedMinutes > 0
    ? Math.min(espelho.totals.workedMinutes / espelho.totals.expectedMinutes, 1)
    : 0;

  const nome = (employee?.name ?? '').split(' ').filter(Boolean).slice(0, 2).join(' ');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: 18 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor="#FFFFFF"
          progressBackgroundColor={c.brand}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([reload(), recarregarEspelho()]);
            setRefreshing(false);
          }}
        />
      }
    >
      {/* Cabeçalho verde: `background:#0BAF29; padding:6px 22px 26px`. */}
      <View style={{ backgroundColor: c.brand, paddingTop: insets.top + 6, paddingHorizontal: 22, paddingBottom: 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <TurinLogo color="#FFFFFF" width={104} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => router.push('/notificacoes')}
              accessibilityRole="button"
              accessibilityLabel="Notificações"
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: 'rgba(255,255,255,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="bell" color="#FFFFFF" size={21} strokeWidth={1.7} />
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 9,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: '#FFD34D',
                  borderWidth: 1.5,
                  borderColor: c.brand,
                }}
              />
            </Pressable>
            <Pressable onPress={() => router.push('/perfil')} accessibilityRole="button" accessibilityLabel="Perfil">
              <Avatar name={employee?.name ?? ''} size={40} raio={12} tinta="#08871F" />
            </Pressable>
          </View>
        </View>

        <Text style={{ marginTop: 16, color: 'rgba(255,255,255,0.82)', fontFamily: fonts.regular, fontSize: 15 }}>
          {greeting(now)},
        </Text>
        <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 25, lineHeight: 27.5, letterSpacing: -0.5 }}>
          {nome}
        </Text>
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
          {escalaHoje?.line ? <HeaderChip icon="bus" text={`Linha ${escalaHoje.line}`} /> : null}
          <HeaderChip text={`Matrícula ${employee?.registration ?? ''}`} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: -14, gap: 14 }}>
        {/* Card do relógio: `border-radius:20px; padding:20px`. */}
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: c.line2,
            shadowColor: c.shadow,
            shadowOpacity: 0.6,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 10 },
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View>
              <Text style={eyebrow(c.muted)}>{`Agora · ${formatDay(now)}`}</Text>
              <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 44, lineHeight: 48, letterSpacing: -0.88 }}>
                {formatTime(now)}
              </Text>
            </View>
            <Tag text={working ? 'Em jornada' : 'Fora de jornada'} tone={working ? 'ok' : 'neutral'} ponto />
          </View>

          <View
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: radius.lg,
              backgroundColor: c.surface2,
            }}
          >
            <Icon name="pin" color={c.text} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
                {escalaHoje?.origin ?? 'Sem escala hoje'}
              </Text>
              <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
                {escalaHoje?.origin ? 'Local de início da escala de hoje' : 'Folga programada'}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label="Marcar ponto"
            iconName="clock"
            onPress={() => router.push('/ponto')}
            sombra={false}
            style={{ marginTop: 14 }}
          />

          {pending > 0 ? (
            <Text style={{ marginTop: 10, color: c.warn, fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' }}>
              {pending === 1 ? '1 marcação aguardando envio' : `${pending} marcações aguardando envio`}
            </Text>
          ) : null}
        </View>

        {/* Marcações de hoje */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginHorizontal: 4, marginBottom: 9 }}>
            <Text style={eyebrow(c.muted)}>Marcações de hoje</Text>
            <Pressable onPress={() => router.push(`/dia/${hojeIso}`)} hitSlop={12} accessibilityRole="button">
              <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 12 }}>Ver detalhe</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {DAY_SLOTS.map((slot, index) => {
              const punch = punches[index];
              return (
                <View
                  key={slot.kind}
                  style={{
                    flex: 1,
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.line2,
                    borderRadius: radius.lg,
                    paddingVertical: 11,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text numberOfLines={1} style={{ ...eyebrow(c.muted, 9), letterSpacing: 0.9, height: 22 }}>
                    {slot.label}
                  </Text>
                  <Text style={{ color: c.text, fontFamily: fonts.bold, fontSize: 17, letterSpacing: -0.34 }}>
                    {loading ? '··' : punch ? formatTime(new Date(punch.punchedAt)) : '--:--'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Banco de horas + escala de hoje */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line2, borderRadius: radius.xl, padding: 15 }}>
            <Text style={{ ...eyebrow(c.muted, 10), letterSpacing: 1.4 }}>Banco de horas</Text>
            <Text
              style={{
                marginTop: 5,
                color: saldo !== null && saldo < 0 ? c.bad : c.brandInk,
                fontFamily: fonts.bold,
                fontSize: 24,
                lineHeight: 26,
                letterSpacing: -0.48,
              }}
            >
              {espelho ? comSinal(espelho.totals.balance, saldo ?? 0) : '--:--'}
            </Text>
            <View style={{ marginTop: 10, height: 5, borderRadius: 3, backgroundColor: c.line, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.round(progresso * 100)}%`, backgroundColor: c.brand, borderRadius: 3 }} />
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line2, borderRadius: radius.xl, padding: 15 }}>
            <Text style={{ ...eyebrow(c.muted, 10), letterSpacing: 1.4 }}>Escala de hoje</Text>
            <Text style={{ marginTop: 5, color: c.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 20, letterSpacing: -0.36 }}>
              {escalaHoje?.window ? escalaHoje.window.replace(' – ', '–') : 'Folga'}
            </Text>
            <Text style={{ marginTop: 6, color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
              {escalaHoje?.vehicle ? `${escalaHoje.shiftName} · Veículo ${escalaHoje.vehicle}` : 'Escala 6x1'}
            </Text>
          </View>
        </View>

        {/* Atalhos */}
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <Atalho icon="swap" label="Ajuste" onPress={() => router.push('/nova-solicitacao')} />
          <Atalho icon="doc" label="Atestado" onPress={() => router.push('/nova-solicitacao?tipo=JUSTIFY_ABSENCE')} />
          <Atalho icon="mirror" label="Escala" onPress={() => router.push('/escala')} />
        </View>
      </View>
    </ScrollView>
  );
}

function HeaderChip({ text, icon }: { text: string; icon?: IconName }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 7,
        backgroundColor: 'rgba(255,255,255,0.16)',
      }}
    >
      {icon ? <Icon name={icon} color="#FFFFFF" size={14} strokeWidth={1.9} /> : null}
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function Atalho({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1,
        height: 48,
        borderRadius: 13,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: pressed ? c.brand : c.line2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      })}
    >
      {({ pressed }) => (
        <>
          <Icon name={icon} color={pressed ? c.brandInk : c.text2} size={18} />
          <Text style={{ color: pressed ? c.brandInk : c.text2, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function comSinal(texto: string, minutos: number): string {
  if (texto.startsWith('+') || texto.startsWith('-') || texto.startsWith('−')) return texto;
  return minutos > 0 ? `+${texto}` : texto;
}

function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/// "qui, 12 set" — o protótipo escreve em minúsculas e o versalete sobe.
function formatDay(date: Date): string {
  return date
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .replace(/\./g, '')
    .replace(' de ', ' ');
}

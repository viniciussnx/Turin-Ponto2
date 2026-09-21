import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { brandGradient, fonts, radius, spacing } from '../../src/theme/tokens';
import { PrimaryButton, TurinLogo } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { DAY_SLOTS, buttonLabelForKind, useToday } from '../../src/punch/useToday';

/// Tela 03 do protótipo — home do colaborador.
export default function HomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { employee } = useAuth();
  const { punches, pending, loading, nextKind, reload } = useToday();

  const [now, setNow] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  // O relógio grande do card precisa andar. De minuto em minuto basta — o
  // protótipo mostra "07:18", sem segundos.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const working = punches.length % 2 === 1;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={c.brand}
          onRefresh={async () => {
            setRefreshing(true);
            await reload();
            setRefreshing(false);
          }}
        />
      }
    >
      <LinearGradient
        colors={[...brandGradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1.4 }}
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl + spacing.xl,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TurinLogo color="#FFFFFF" width={116} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Pressable
              onPress={() => router.push('/notificacoes')}
              hitSlop={10}
              accessibilityLabel="Notificações"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="bell" color="#FFFFFF" size={21} />
              {/* Marcador de não lidas. Vira contagem real quando o servidor
                  passar a enviar notificações. */}
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FFD84D',
                }}
              />
            </Pressable>

            <Pressable onPress={() => router.push('/perfil')} accessibilityLabel="Perfil">
              <Avatar name={employee?.name ?? ''} />
            </Pressable>
          </View>
        </View>

        <Text
          style={{
            marginTop: spacing.xl,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: fonts.regular,
            fontSize: 15,
          }}
        >
          {greeting(now)},
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: fonts.display,
            fontSize: 30,
            letterSpacing: 0.4,
          }}
        >
          {(employee?.name ?? '').toUpperCase()}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          {employee?.position ? <Chip text={employee.position} /> : null}
          <Chip text={`Matrícula ${employee?.registration ?? ''}`} />
        </View>
      </LinearGradient>

      {/* Card do relógio, sobreposto ao degradê como no protótipo. */}
      <View
        style={{
          marginTop: -spacing.xxl,
          marginHorizontal: spacing.lg,
          backgroundColor: c.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          gap: spacing.lg,
          shadowColor: c.shadow,
          shadowOpacity: 1,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 6,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              color: c.muted,
              fontFamily: fonts.semibold,
              fontSize: 11,
              letterSpacing: 1.4,
            }}
          >
            {`AGORA · ${formatDay(now)}`.toUpperCase()}
          </Text>
          <StatusPill working={working} />
        </View>

        <Text
          style={{
            color: c.text,
            fontFamily: fonts.display,
            fontSize: 52,
            lineHeight: 56,
            letterSpacing: 1,
          }}
        >
          {formatTime(now)}
        </Text>

        <PrimaryButton
          label={buttonLabelForKind(nextKind)}
          onPress={() => router.push('/ponto')}
        />

        {pending > 0 ? (
          <Text
            style={{
              color: c.warn,
              fontFamily: fonts.medium,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {pending === 1
              ? '1 marcação aguardando envio'
              : `${pending} marcações aguardando envio`}
          </Text>
        ) : null}
      </View>

      {/* Marcações de hoje */}
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              color: c.muted,
              fontFamily: fonts.semibold,
              fontSize: 11,
              letterSpacing: 1.4,
            }}
          >
            MARCAÇÕES DE HOJE
          </Text>
          <Pressable onPress={() => router.push('/espelho')} hitSlop={8}>
            <Text style={{ color: c.brand, fontFamily: fonts.semibold, fontSize: 14 }}>
              Ver detalhe
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {DAY_SLOTS.map((slot, index) => (
            <SlotCell
              key={slot.kind}
              label={slot.label}
              time={punches[index] ? formatTime(new Date(punches[index].punchedAt)) : null}
              loading={loading}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function StatusPill({ working }: { working: boolean }) {
  const { c } = useTheme();
  const color = working ? c.brand : c.muted;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: working ? c.brandSoft : c.surface2,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontFamily: fonts.semibold, fontSize: 13 }}>
        {working ? 'Em jornada' : 'Fora de jornada'}
      </Text>
    </View>
  );
}

function SlotCell({
  label,
  time,
  loading,
}: {
  label: string;
  time: string | null;
  loading: boolean;
}) {
  const { c } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.line,
        paddingVertical: spacing.md,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text
        style={{
          color: c.muted,
          fontFamily: fonts.semibold,
          fontSize: 10,
          letterSpacing: 1.1,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={{
          color: time ? c.text : c.muted,
          fontFamily: fonts.display,
          fontSize: 20,
        }}
      >
        {loading ? '··' : (time ?? '--:--')}
      </Text>
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#0BAF29', fontFamily: fonts.bold, fontSize: 15 }}>{initials}</Text>
    </View>
  );
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

function formatDay(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

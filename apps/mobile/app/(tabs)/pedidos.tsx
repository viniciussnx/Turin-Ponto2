import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { BrandHeader, Card, EmptyState, Tag, UnderlineTabs } from '../../src/components/layout';
import {
  STATUS_LABEL,
  TYPE_LABEL,
  formatDate,
  protocolOf,
  statusTone,
  typeIcon,
  useAdjustments,
  type Adjustment,
} from '../../src/api/adjustments';

const TABS = ['Todas', 'Em análise', 'Aprovadas', 'Recusadas'] as const;
type TabName = (typeof TABS)[number];

/// Tela 07 do protótipo — solicitações.
export default function PedidosScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<TabName>('Todas');
  const { items, loading, error, reload } = useAdjustments();

  // Recarrega ao voltar de "nova solicitação": o pedido recém-criado precisa
  // aparecer sem o usuário ter que puxar a lista.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const visible = useMemo(() => {
    if (tab === 'Em análise') return items.filter((item) => item.status === 'PENDING');
    if (tab === 'Aprovadas') return items.filter((item) => item.status === 'APPROVED');
    if (tab === 'Recusadas') return items.filter((item) => item.status === 'REJECTED');
    return items;
  }, [items, tab]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <BrandHeader
        title="Solicitações"
        subtitle="Ajustes, abonos e justificativas"
        right={
          <Pressable
            onPress={() => router.push('/nova-solicitacao')}
            hitSlop={12}
            accessibilityLabel="Nova solicitação"
          >
            <Icon name="plus" color="#FFFFFF" size={26} />
          </Pressable>
        }
      />

      <View style={{ backgroundColor: c.surface }}>
        <UnderlineTabs options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={c.brand} />
        }
      >
        {error ? (
          <Card>
            <Text style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 14 }}>{error}</Text>
          </Card>
        ) : null}

        {loading && items.length === 0 ? (
          <ActivityIndicator color={c.brand} style={{ marginTop: spacing.xxl }} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={tab === 'Todas' ? 'Nenhuma solicitação' : `Nada em "${tab}"`}
            detail={
              tab === 'Todas'
                ? 'Quando precisar corrigir uma marcação ou justificar uma falta, abra um pedido pelo botão +.'
                : undefined
            }
          />
        ) : (
          visible.map((item) => (
            <AdjustmentCard
              key={item.id}
              adjustment={item}
              onPress={() => router.push(`/solicitacao/${item.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AdjustmentCard({
  adjustment,
  onPress,
}: {
  adjustment: Adjustment;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const tone = statusTone(adjustment.status);
  const toneInk = { ok: c.brandInk, warn: c.warn, bad: c.bad, neutral: c.muted }[tone];
  const toneBg = {
    ok: c.brandSoft,
    warn: 'rgba(217,138,0,0.12)',
    bad: 'rgba(214,69,69,0.10)',
    neutral: c.surface2,
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.line,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: toneBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={typeIcon(adjustment.type)} color={toneInk} size={20} />
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>
          {TYPE_LABEL[adjustment.type]}
        </Text>
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
          {`Protocolo #${protocolOf(adjustment.id)} · ${formatDate(adjustment.localDate)}`}
        </Text>
        <Tag text={STATUS_LABEL[adjustment.status]} tone={tone} />
      </View>

      <Icon name="chevron-right" color={c.muted} size={20} />
    </Pressable>
  );
}

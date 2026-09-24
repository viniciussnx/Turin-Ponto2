import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, radius } from '../../src/theme/tokens';
import { IconButton, PrimaryButton } from '../../src/components/ui';
import { Card, Divider, EmptyState, IconChip, Tag, TopBar, UnderlineTabs } from '../../src/components/layout';
import {
  STATUS_LABEL,
  TYPE_LABEL,
  formatDate,
  formatDateTime,
  protocolOf,
  statusTone,
  typeIcon,
  useAdjustments,
  type Adjustment,
} from '../../src/api/adjustments';

const TABS = ['Todas', 'Em análise', 'Aprovadas', 'Recusadas'] as const;
type TabName = (typeof TABS)[number];

/// Tela 07 do protótipo — solicitações, com abas funcionais.
export default function PedidosScreen() {
  const { c } = useTheme();
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
      <TopBar
        title="Solicitações"
        big
        border={false}
        right={<IconButton name="filter" label="Histórico por data" cor={c.text2} onPress={() => router.push('/ajustes')} />}
      >
        <View style={{ marginTop: -4, marginBottom: -16 }}>
          <UnderlineTabs options={TABS} value={tab} onChange={setTab} />
        </View>
      </TopBar>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, gap: 11 }}
        refreshControl={<RefreshControl refreshing={loading && items.length > 0} onRefresh={reload} tintColor={c.brand} />}
      >
        {error ? (
          <Card>
            <Text style={{ color: c.bad, fontFamily: fonts.medium, fontSize: 14 }}>{error}</Text>
          </Card>
        ) : null}

        {loading && items.length === 0 ? (
          <ActivityIndicator color={c.brand} style={{ marginTop: 28 }} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={tab === 'Todas' ? 'Nenhuma solicitação' : `Nada em "${tab}"`}
            detail={
              tab === 'Todas'
                ? 'Quando precisar corrigir uma marcação ou justificar uma falta, abra um pedido pelo botão abaixo.'
                : undefined
            }
          />
        ) : (
          visible.map((item) => (
            <CartaoSolicitacao key={item.id} adjustment={item} onPress={() => router.push(`/solicitacao/${item.id}`)} />
          ))
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 }}>
        <PrimaryButton label="Nova solicitação" iconName="plus" onPress={() => router.push('/nova-solicitacao')} />
      </View>
    </View>
  );
}

/*
 * Cartão da tela 07: ícone em quadrado de 36 pt (raio 11), título `600 15px`,
 * meta `400 12px`, etiqueta de status e, abaixo de uma linha tracejada, o
 * detalhe `400 12.5px/1.5`.
 */
function CartaoSolicitacao({ adjustment, onPress }: { adjustment: Adjustment; onPress: () => void }) {
  const { c } = useTheme();
  const tone = statusTone(adjustment.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.surface2 : c.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: c.line2,
        paddingVertical: 15,
        paddingHorizontal: 16,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <IconChip icon={typeIcon(adjustment.type)} tone={tone === 'neutral' ? 'neutral' : tone} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{TYPE_LABEL[adjustment.type]}</Text>
          <Text style={{ marginTop: 1, color: c.muted, fontFamily: fonts.regular, fontSize: 12 }}>
            {`Protocolo #${protocolOf(adjustment.id)} · ${formatDate(adjustment.localDate).slice(0, 5)}`}
          </Text>
        </View>
        <Tag text={STATUS_LABEL[adjustment.status]} tone={tone} />
      </View>
      <View style={{ marginTop: 11 }}>
        <Divider tracejada />
      </View>
      <Text style={{ marginTop: 11, color: c.text2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18.75 }}>
        {detalhe(adjustment)}
      </Text>
    </Pressable>
  );
}

function detalhe(adjustment: Adjustment): string {
  if (adjustment.status === 'PENDING') {
    return `Solicitado em ${formatDateTime(adjustment.createdAt)}. Aguardando validação do RH.`;
  }
  if (adjustment.reviewNote) return adjustment.reviewNote;
  if (adjustment.status === 'APPROVED' && adjustment.reviewedAt) {
    return `Aprovado pelo RH em ${formatDateTime(adjustment.reviewedAt)}.`;
  }
  if (adjustment.status === 'CANCELLED') return 'Cancelado por você.';
  return adjustment.reason;
}

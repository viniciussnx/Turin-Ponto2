import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, spacing } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { PrimaryButton } from '../../src/components/ui';
import { Card, EmptyState, Screen, SectionLabel, Tag } from '../../src/components/layout';
import {
  STATUS_LABEL,
  TYPE_LABEL,
  cancelAdjustment,
  formatDate,
  formatDateTime,
  protocolOf,
  statusTone,
  useAdjustments,
} from '../../src/api/adjustments';

/// Tela 16 do protótipo — detalhe da solicitação.
export default function AdjustmentDetailScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, loading, reload } = useAdjustments();
  const [cancelling, setCancelling] = useState(false);

  const adjustment = items.find((item) => item.id === id);

  function confirmCancel() {
    Alert.alert(
      'Cancelar solicitação',
      'O pedido será encerrado sem análise. Você pode abrir outro depois.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelAdjustment(id);
              await reload();
              router.back();
            } catch (failure) {
              Alert.alert('Não foi possível cancelar', (failure as Error).message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  if (loading && !adjustment) {
    return (
      <Screen title="Solicitação">
        <ActivityIndicator color={c.brandAction} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (!adjustment) {
    return (
      <Screen title="Solicitação">
        <EmptyState icon="alert" title="Solicitação não encontrada" />
      </Screen>
    );
  }

  const tone = statusTone(adjustment.status);

  return (
    <Screen
      title={TYPE_LABEL[adjustment.type]}
      subtitle={`Protocolo #${protocolOf(adjustment.id)}`}
    >
      <View style={{ gap: spacing.lg }}>
        <Card highlighted={adjustment.status === 'PENDING'}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SectionLabel>Situação</SectionLabel>
            <Tag text={STATUS_LABEL[adjustment.status]} tone={tone} />
          </View>

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Row label="Dia de referência" value={formatDate(adjustment.localDate)} />
            <Row label="Aberto em" value={formatDateTime(adjustment.createdAt)} />
            {adjustment.proposedAt ? (
              <Row
                label="Horário pretendido"
                value={new Date(adjustment.proposedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            ) : null}
            {adjustment.targetPunch ? (
              <Row
                label="Marcação afetada"
                value={new Date(adjustment.targetPunch.punchedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            ) : null}
            {adjustment.reviewedAt ? (
              <Row label="Analisado em" value={formatDateTime(adjustment.reviewedAt)} />
            ) : null}
          </View>
        </Card>

        <Card>
          <SectionLabel>Sua justificativa</SectionLabel>
          <Text
            style={{
              marginTop: spacing.sm,
              color: c.text2,
              fontFamily: fonts.regular,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {adjustment.reason}
          </Text>
        </Card>

        {adjustment.reviewNote ? (
          <Card>
            <SectionLabel>Resposta do RH</SectionLabel>
            <View
              style={{
                marginTop: spacing.sm,
                flexDirection: 'row',
                gap: spacing.sm,
                alignItems: 'flex-start',
              }}
            >
              <Icon
                name={adjustment.status === 'APPROVED' ? 'check' : 'alert'}
                color={adjustment.status === 'APPROVED' ? c.brandInk : c.bad}
                size={20}
              />
              <Text
                style={{
                  flex: 1,
                  color: c.text2,
                  fontFamily: fonts.regular,
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {adjustment.reviewNote}
              </Text>
            </View>
          </Card>
        ) : null}

        {adjustment.status === 'PENDING' ? (
          <>
            <Text
              style={{
                color: c.muted,
                fontFamily: fonts.regular,
                fontSize: 13,
                lineHeight: 19,
                textAlign: 'center',
              }}
            >
              Aguardando análise do RH. Você recebe um aviso quando houver resposta.
            </Text>
            {/* Cancelar um pedido é destrutivo e irreversível: precisa ler como
                tal, e não com o mesmo verde da ação de confirmar. */}
            <PrimaryButton
              label="Cancelar pedido"
              destrutivo
              onPress={confirmCancel}
              loading={cancelling}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { eyebrow, fonts } from '../../src/theme/tokens';
import { Icon, type IconName } from '../../src/components/Icon';
import { SecondaryButton } from '../../src/components/ui';
import { useToneColors } from '../../src/components/layout';
import {
  STATUS_LABEL,
  TYPE_LABEL,
  cancelAdjustment,
  formatDate,
  protocolOf,
  statusTone,
  useAdjustments,
  type Adjustment,
} from '../../src/api/adjustments';

/// Tela 16 do protótipo — detalhe da solicitação como folha sobre a lista:
/// fundo desfocado e escurecido (`rgba(7,19,13,.52)`), cartão de raio 26
/// com 14 pt de margem.
export default function AdjustmentDetailScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, loading, reload } = useAdjustments();
  const [cancelling, setCancelling] = useState(false);

  const adjustment = items.find((item) => item.id === id);

  function confirmCancel() {
    Alert.alert('Cancelar solicitação', 'O pedido será encerrado sem análise. Você pode abrir outro depois.', [
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
    ]);
  }

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <BlurView intensity={18} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={() => router.back()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,19,13,0.52)' }}
      />

      <View
        style={{
          marginHorizontal: 14,
          marginBottom: Math.max(insets.bottom, 12) + 14,
          maxHeight: '86%',
          borderRadius: 26,
          backgroundColor: c.surface,
          shadowColor: '#000000',
          shadowOpacity: 0.42,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: -12 },
          elevation: 12,
        }}
      >
        <ScrollView contentContainerStyle={{ paddingTop: 22, paddingHorizontal: 22, paddingBottom: 24 }}>
          {loading && !adjustment ? (
            <ActivityIndicator color={c.brand} style={{ marginVertical: 28 }} />
          ) : !adjustment ? (
            <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15, marginVertical: 20 }}>
              Solicitação não encontrada.
            </Text>
          ) : (
            <Conteudo
              adjustment={adjustment}
              onFechar={() => router.back()}
              onCancelar={confirmCancel}
              cancelando={cancelling}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function Conteudo({
  adjustment,
  onFechar,
  onCancelar,
  cancelando,
}: {
  adjustment: Adjustment;
  onFechar: () => void;
  onCancelar: () => void;
  cancelando: boolean;
}) {
  const { c } = useTheme();
  const tone = statusTone(adjustment.status);
  const cores = useToneColors()(tone);
  const iconeStatus: IconName =
    adjustment.status === 'APPROVED' ? 'check' : adjustment.status === 'REJECTED' ? 'x' : adjustment.status === 'PENDING' ? 'clock' : 'x';

  const horarios = [adjustment.targetPunch?.punchedAt, adjustment.proposedAt]
    .filter((iso): iso is string => !!iso)
    .map((iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  const analisado = adjustment.status === 'APPROVED' || adjustment.status === 'REJECTED';

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              height: 26,
              paddingHorizontal: 11,
              borderRadius: 8,
              backgroundColor: cores.bg,
              borderWidth: 1,
              borderColor: cores.line,
            }}
          >
            <Icon name={iconeStatus} color={cores.ink} size={14} strokeWidth={2.6} />
            <Text style={{ color: cores.ink, fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 10.5 * 0.12, textTransform: 'uppercase' }}>
              {STATUS_LABEL[adjustment.status]}
            </Text>
          </View>
          <Text style={{ marginTop: 11, color: c.text, fontFamily: fonts.bold, fontSize: 24, lineHeight: 26, letterSpacing: -0.48 }}>
            {TYPE_LABEL[adjustment.type]}
          </Text>
          <Text style={{ marginTop: 4, color: c.muted, fontFamily: fonts.medium, fontSize: 12.5 }}>
            {`Protocolo #${protocolOf(adjustment.id)} · ${dataHora(adjustment.createdAt)}`}
          </Text>
        </View>
        <Pressable
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={6}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: c.surface2,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" color={c.text2} size={18} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ marginTop: 20, gap: 14 }}>
        <Bloco rotulo={adjustment.type === 'JUSTIFY_ABSENCE' ? 'Dia justificado' : 'Registros alterados'}>
          <Text style={{ marginTop: 7, color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
            {`${formatDate(adjustment.localDate)} · ${diaDaSemana(adjustment.localDate)}`}
          </Text>
          {horarios.length > 0 ? (
            <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {horarios.map((hora, i) => (
                <View
                  key={`${hora}-${i}`}
                  style={{
                    height: 32,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: c.brandSoft,
                    borderWidth: 1,
                    borderColor: c.brandLine,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: c.brandInk, fontFamily: fonts.bold, fontSize: 13, letterSpacing: -0.26 }}>{hora}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Bloco>

        <View style={{ height: 1, backgroundColor: c.line2 }} />

        <Bloco rotulo="Motivo informado">
          <Text style={{ marginTop: 6, color: c.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20.3 }}>
            {adjustment.reason}
          </Text>
        </Bloco>

        {adjustment.reviewNote ? (
          <>
            <View style={{ height: 1, backgroundColor: c.line2 }} />
            <Bloco rotulo="Resposta do RH">
              <Text style={{ marginTop: 6, color: c.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20.3 }}>
                {adjustment.reviewNote}
              </Text>
            </Bloco>
          </>
        ) : null}

        <View style={{ height: 1, backgroundColor: c.line2 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.text2, fontFamily: fonts.bold, fontSize: 14 }}>RH</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...eyebrow(c.muted, 10.5), letterSpacing: 10.5 * 0.14 }}>
              {adjustment.status === 'APPROVED' ? 'Aprovado por' : adjustment.status === 'REJECTED' ? 'Recusado por' : 'Análise'}
            </Text>
            <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>
              {analisado && adjustment.reviewedAt
                ? `RH · ${dataHora(adjustment.reviewedAt)}`
                : adjustment.status === 'CANCELLED'
                  ? 'Cancelada por você'
                  : 'Aguardando o RH'}
            </Text>
          </View>
          <Icon name="shield" color={c.text} size={19} />
        </View>

        {adjustment.status === 'PENDING' ? (
          <SecondaryButton
            label={cancelando ? 'Cancelando…' : 'Cancelar solicitação'}
            iconName="x"
            tom="bad"
            disabled={cancelando}
            onPress={onCancelar}
            style={{ marginTop: 4 }}
          />
        ) : null}
      </View>
    </>
  );
}

function Bloco({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View>
      <Text style={{ ...eyebrow(c.muted, 10.5), letterSpacing: 10.5 * 0.14 }}>{rotulo}</Text>
      {children}
    </View>
  );
}

/// "01/09/2026 às 06:50".
function dataHora(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function diaDaSemana(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
}

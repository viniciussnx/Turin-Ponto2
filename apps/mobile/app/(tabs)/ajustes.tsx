import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { eyebrow, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { EmptyState, SectionLabel, Tag, TopBar } from '../../src/components/layout';
import {
  STATUS_LABEL,
  TYPE_LABEL,
  formatDate,
  protocolOf,
  statusTone,
  useAdjustments,
  type Adjustment,
} from '../../src/api/adjustments';

/// Tela 15 do protótipo — histórico de ajustes filtrado por data.
export default function AjustesScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { items, loading, reload } = useAdjustments();

  const hoje = new Date();
  const [inicio, setInicio] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7));
  const [fim, setFim] = useState(() => hoje);
  const [recentesPrimeiro, setRecentesPrimeiro] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const visiveis = useMemo(() => {
    const de = isoDia(inicio);
    const ate = isoDia(fim);
    const lista = items.filter((item) => item.localDate.slice(0, 10) >= de && item.localDate.slice(0, 10) <= ate);
    return lista.sort((a, b) =>
      recentesPrimeiro ? b.localDate.localeCompare(a.localDate) : a.localDate.localeCompare(b.localDate),
    );
  }, [items, inicio, fim, recentesPrimeiro]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="Ajustes de marcação"
        border={false}
        fundo={c.bg}
        onBack={() => (router.canGoBack() ? router.back() : router.navigate('/pedidos'))}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <SectionLabel style={{ marginHorizontal: 2, marginBottom: 9 }}>Filtro por data</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <CaixaData rotulo="Inicial" valor={inicio} maximo={fim} onChange={setInicio} />
          <CaixaData rotulo="Final" valor={fim} minimo={inicio} maximo={hoje} onChange={setFim} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12.5 }}>
          {visiveis.length === 1 ? '1 solicitação no período' : `${visiveis.length} solicitações no período`}
        </Text>
        <Pressable
          onPress={() => setRecentesPrimeiro((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={recentesPrimeiro ? 'Ordenar das mais antigas' : 'Ordenar das mais recentes'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}
        >
          <Icon name="filter" color={c.brandInk} size={16} strokeWidth={1.9} />
          <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 12.5 }}>Ordenar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18, gap: 11 }}>
        {loading && items.length === 0 ? (
          <ActivityIndicator color={c.brand} style={{ marginTop: 28 }} />
        ) : visiveis.length === 0 ? (
          <EmptyState icon="calendar" title="Nada no período" detail="Mude as datas para ver outras solicitações." />
        ) : (
          visiveis.map((item) => (
            <Cartao key={item.id} item={item} onPress={() => router.push(`/solicitacao/${item.id}`)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/// Cartão com a barra colorida de 5 pt à esquerda.
function Cartao({ item, onPress }: { item: Adjustment; onPress: () => void }) {
  const { c } = useTheme();
  const tone = statusTone(item.status);
  const barra = tone === 'ok' ? c.brand : tone === 'warn' ? '#D98A00' : tone === 'bad' ? c.bad : c.muted;
  const criado = new Date(item.createdAt);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: pressed ? c.surface2 : c.surface,
        borderWidth: 1,
        borderColor: c.line2,
        borderRadius: 18,
        overflow: 'hidden',
      })}
    >
      <View style={{ width: 5, backgroundColor: barra }} />
      <View style={{ flex: 1, paddingVertical: 15, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ flex: 1, color: c.text, fontFamily: fonts.semibold, fontSize: 16 }}>{TYPE_LABEL[item.type]}</Text>
          <Tag text={STATUS_LABEL[item.status]} tone={tone} caixaAlta />
        </View>
        <Text style={{ marginTop: 5, color: c.text2, fontFamily: fonts.regular, fontSize: 13.5 }}>
          {`Referente ao dia ${formatDate(item.localDate)}`}
        </Text>
        <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11.5 }}>{`Protocolo #${protocolOf(item.id)}`}</Text>
          <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11.5 }}>
            {`${criado.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${criado.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/// Caixa de data de 60 pt: ícone de calendário `--brand-ink`, rótulo em
/// versalete e a data `600 15px`. Abre o seletor nativo.
function CaixaData({
  rotulo,
  valor,
  onChange,
  minimo,
  maximo,
}: {
  rotulo: string;
  valor: Date;
  onChange: (d: Date) => void;
  minimo?: Date;
  maximo?: Date;
}) {
  const { c } = useTheme();
  const [aberto, setAberto] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`Data ${rotulo.toLowerCase()}: ${valor.toLocaleDateString('pt-BR')}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          height: 60,
          paddingHorizontal: 14,
          borderRadius: 15,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: aberto ? c.brandLine : c.line2,
        }}
      >
        <Icon name="calendar" color={c.text} size={21} strokeWidth={1.7} />
        <View>
          <Text style={{ ...eyebrow(c.muted, 10), letterSpacing: 1 }}>{rotulo}</Text>
          <Text style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 15 }}>{valor.toLocaleDateString('pt-BR')}</Text>
        </View>
      </Pressable>
      {aberto ? (
        <DateTimePicker
          value={valor}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimo}
          maximumDate={maximo}
          locale="pt-BR"
          onChange={(evento, escolhido) => {
            if (Platform.OS === 'android') setAberto(false);
            if (evento.type === 'dismissed' || !escolhido) return;
            onChange(escolhido);
          }}
        />
      ) : null}
    </View>
  );
}

function isoDia(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

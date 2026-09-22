import { useState } from 'react';
import {
  BrandHeader,
  Card,
  Icon,
  Pressable,
  StatTile,
  Text,
  TurinLogo,
  UnderlineTabs,
  View,
  fonts,
  palettes,
  spacing,
} from '@turin/mobile-ds';

const c = palettes.light;
const noop = () => {};
const Celular = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: 390, backgroundColor: c.bg }}>{children}</View>
);

// Solicitações: título + subtítulo + ação "+" à direita, abas logo abaixo.
export const ComAcao = () => {
  const [aba, setAba] = useState('Todas');
  return (
    <Celular>
      <BrandHeader
        title="Solicitações"
        subtitle="Ajustes, abonos e justificativas"
        right={
          <Pressable accessibilityLabel="Nova solicitação">
            <Icon name="plus" color="#FFFFFF" size={26} />
          </Pressable>
        }
      />
      <View style={{ backgroundColor: c.surface }}>
        <UnderlineTabs
          options={['Todas', 'Em análise', 'Aprovadas', 'Recusadas']}
          value={aba}
          onChange={setAba}
        />
      </View>
    </Celular>
  );
};

// Espelho: cabeçalho compacto com card sobreposto.
export const CompactoComCard = () => (
  <Celular>
    <BrandHeader title="Espelho de ponto" subtitle="Setembro de 2026" compact />
    <View style={{ marginTop: -spacing.xxl, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
      <Card>
        <View style={{ flexDirection: 'row' }}>
          <StatTile value="136:24" label="Trabalhado" />
          <StatTile value="+04:12" label="Saldo" tone="brand" />
          <StatTile value="2" label="Pendências" tone="warn" />
        </View>
      </Card>
    </View>
  </Celular>
);

// Tela interna com voltar.
export const ComVoltar = () => (
  <Celular>
    <BrandHeader title="Trocar senha" subtitle="Escolha uma senha só sua" onBack={noop} />
  </Celular>
);

// Home: logo e sino no topo, saudação no conteúdo.
export const Inicio = () => (
  <Celular>
    <BrandHeader
      title="Bom dia, Maria"
      subtitle="Sexta, 18 de setembro · Linha 212"
      right={<Icon name="bell" color="#FFFFFF" size={24} />}
    >
      <View style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <TurinLogo color="#FFFFFF" width={96} />
        <Text style={{ color: 'rgba(255,255,255,0.82)', fontFamily: fonts.medium, fontSize: 13 }}>
          Meu Ponto
        </Text>
      </View>
    </BrandHeader>
  </Celular>
);

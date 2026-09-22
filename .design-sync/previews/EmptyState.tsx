import { EmptyState, View } from '@turin/mobile-ds';

export const Solicitacoes = () => (
  <View style={{ width: 358 }}>
    <EmptyState
      icon="inbox"
      title="Nenhuma solicitação"
      detail="Quando precisar corrigir uma marcação ou justificar uma falta, abra um pedido pelo botão +."
    />
  </View>
);

export const Espelho = () => (
  <View style={{ width: 358 }}>
    <EmptyState icon="mirror" title="Nada por aqui" detail="Ainda não há marcações neste mês." />
  </View>
);

export const SoTitulo = () => (
  <View style={{ width: 358 }}>
    <EmptyState icon="user" title='Ninguém em "Ausentes"' />
  </View>
);

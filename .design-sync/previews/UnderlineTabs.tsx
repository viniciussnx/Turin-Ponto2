import { useState } from 'react';
import { UnderlineTabs, View, palettes } from '@turin/mobile-ds';

const c = palettes.light;

// Solicitações (app/(tabs)/pedidos.tsx), sobre `surface`.
export const Solicitacoes = () => {
  const [v, setV] = useState('Todas');
  return (
    <View style={{ width: 390, backgroundColor: c.surface }}>
      <UnderlineTabs options={['Todas', 'Em análise', 'Aprovadas', 'Recusadas']} value={v} onChange={setV} />
    </View>
  );
};

export const OutraAtiva = () => {
  const [v, setV] = useState('Aprovadas');
  return (
    <View style={{ width: 390, backgroundColor: c.surface }}>
      <UnderlineTabs options={['Todas', 'Em análise', 'Aprovadas', 'Recusadas']} value={v} onChange={setV} />
    </View>
  );
};

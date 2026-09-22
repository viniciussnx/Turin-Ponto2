import { useState } from 'react';
import { ChipFilters, View } from '@turin/mobile-ds';

// Espelho de ponto (app/(tabs)/espelho.tsx).
export const Espelho = () => {
  const [v, setV] = useState('Todos');
  return (
    <View style={{ width: 358 }}>
      <ChipFilters options={['Todos', 'Pendências', 'Extras']} value={v} onChange={setV} />
    </View>
  );
};

// Presença da equipe (app/gestor.tsx), com outro filtro ativo.
export const Gestor = () => {
  const [v, setV] = useState('Atrasos');
  return (
    <View style={{ width: 358 }}>
      <ChipFilters options={['Todos', 'Presentes', 'Atrasos', 'Ausentes']} value={v} onChange={setV} />
    </View>
  );
};

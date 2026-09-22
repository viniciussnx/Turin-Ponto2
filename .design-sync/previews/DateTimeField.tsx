import { DateTimeField, View, spacing } from '@turin/mobile-ds';

const noop = () => {};
// Datas fixas para o cartão não mudar a cada dia.
const dia = new Date(2026, 8, 18, 12, 2);

export const Data = () => (
  <View style={{ width: 342 }}>
    <DateTimeField label="Dia de referência" modo="date" valor={dia} onChange={noop} />
  </View>
);

export const Hora = () => (
  <View style={{ width: 342 }}>
    <DateTimeField label="Horário correto" modo="time" valor={dia} onChange={noop} />
  </View>
);

// Formulário de nova solicitação: data + hora com dica.
export const NovaSolicitacao = () => (
  <View style={{ width: 342, gap: spacing.lg }}>
    <DateTimeField label="Dia de referência" modo="date" valor={dia} onChange={noop} />
    <DateTimeField
      label="Horário correto"
      modo="time"
      valor={dia}
      onChange={noop}
      hint="O horário em que você realmente voltou do intervalo."
    />
  </View>
);

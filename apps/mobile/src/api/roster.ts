/// Escala, notificações e presença da equipe.
///
/// ATENÇÃO: nada aqui vem do servidor ainda. O backend não modela turno, linha,
/// veículo, notificações nem presença de equipe — ver "Próximos passos" no
/// README. Os dados abaixo são de demonstração, com a MESMA forma que os
/// endpoints reais devem devolver, para que ligar de verdade seja trocar o
/// corpo destas funções por uma chamada de `api()` sem tocar nas telas.
///
/// Toda tela que consome isto exibe um aviso de dado provisório: número
/// inventado passando por real é pior que tela vazia.

export const IS_PROVISIONAL = true;

export interface ShiftDay {
  date: string;
  weekday: string;
  day: string;
  /// "T1", "T2" ou "F" (folga).
  shiftCode: string;
  shiftName: string;
  /// Nulo em dia de folga.
  window: string | null;
  line: string | null;
  vehicle: string | null;
  breakWindow: string | null;
  origin: string | null;
}

export interface ShiftWeek {
  days: ShiftDay[];
  scheduleName: string;
}

export interface WorkedBlock {
  key: 'prevista' | 'realizada';
  title: string;
  subtitle: string;
  total: string;
  periods: { label: string; window: string; icon: 'clock' | 'coffee' | 'bus' }[];
  empty: boolean;
}

export interface AppNotification {
  id: string;
  group: string;
  icon: 'check' | 'swap' | 'alert' | 'mirror' | 'doc';
  tone: 'ok' | 'warn' | 'bad' | 'neutral';
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: 'Presente' | 'Atraso' | 'Ausente';
  time: string;
}

/// Semana de escala. Substituir por `GET /schedule/me?week=...`.
export function getShiftWeek(reference = new Date()): ShiftWeek {
  const monday = startOfWeek(reference);
  const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

  const days = weekdays.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const isSunday = index === 6;
    const isSaturday = index === 5;
    const shiftCode = isSunday ? 'F' : isSaturday ? 'T2' : 'T1';

    return {
      date: toIsoDay(date),
      weekday,
      day: String(date.getDate()).padStart(2, '0'),
      shiftCode,
      shiftName: isSunday ? 'Folga' : isSaturday ? 'Turno 2' : 'Turno 1',
      window: isSunday ? null : isSaturday ? '13:10 – 21:40' : '06:40 – 15:20',
      line: isSunday ? null : isSaturday ? '118' : '302',
      vehicle: isSunday ? null : isSaturday ? '4187' : '4412',
      breakWindow: isSunday ? null : isSaturday ? '17:00 – 18:00' : '11:40 – 12:40',
      origin: isSunday ? null : 'Garagem Contagem',
    };
  });

  return { days, scheduleName: 'Escala 6x1' };
}

/// Comparação prevista × realizada de um dia (tela 17).
export function getWorkedBlocks(day: ShiftDay, workedTotal: string | null): WorkedBlock[] {
  return [
    {
      key: 'prevista',
      title: 'Escala prevista',
      subtitle: day.shiftCode === 'F' ? 'Folga programada' : `Dia trabalhado · ${day.shiftName}`,
      total: day.window ? durationOf(day.window) : '—',
      periods: day.window
        ? [
            { label: 'Jornada', window: day.window, icon: 'clock' },
            ...(day.breakWindow
              ? [{ label: 'Intervalo', window: day.breakWindow, icon: 'coffee' as const }]
              : []),
            ...(day.line
              ? [{ label: 'Linha prevista', window: day.line, icon: 'bus' as const }]
              : []),
          ]
        : [],
      empty: !day.window,
    },
    {
      key: 'realizada',
      title: 'Escala realizada',
      subtitle: workedTotal ? 'Apurado pelas marcações' : 'Jornada em andamento',
      total: workedTotal ?? '--:--',
      periods: [],
      empty: !workedTotal,
    },
  ];
}

/// Substituir por `GET /notifications`.
export function getNotifications(): AppNotification[] {
  return [
    {
      id: '1',
      group: 'Hoje',
      icon: 'check',
      tone: 'ok',
      title: 'Entrada registrada',
      body: 'Marcação confirmada na Garagem Contagem.',
      time: 'há 4 min',
      unread: true,
    },
    {
      id: '2',
      group: 'Hoje',
      icon: 'swap',
      tone: 'warn',
      title: 'Ajuste em análise',
      body: 'Seu pedido foi encaminhado ao encarregado.',
      time: '07:20',
      unread: true,
    },
    {
      id: '3',
      group: 'Ontem',
      icon: 'alert',
      tone: 'bad',
      title: 'Saída não registrada',
      body: 'Jornada aberta detectada. Registre a saída ou solicite ajuste.',
      time: '17:30',
      unread: false,
    },
    {
      id: '4',
      group: 'Ontem',
      icon: 'mirror',
      tone: 'neutral',
      title: 'Nova escala publicada',
      body: 'Turno 1 de segunda a sexta, Turno 2 no sábado.',
      time: '12:05',
      unread: false,
    },
    {
      id: '5',
      group: 'Esta semana',
      icon: 'doc',
      tone: 'neutral',
      title: 'Espelho do mês anterior fechado',
      body: 'Confira e assine o espelho até o dia 15.',
      time: 'seg',
      unread: false,
    },
  ];
}

/// Substituir por `GET /team/presence` — exige token de encarregado.
export function getTeamPresence(): TeamMember[] {
  return [
    { id: '1', name: 'Ana Beatriz Lima', initials: 'AB', role: 'Cobradora · Linha 302', status: 'Presente', time: '06:52' },
    { id: '2', name: 'Carlos Eduardo Pinho', initials: 'CE', role: 'Motorista · Linha 118', status: 'Presente', time: '06:48' },
    { id: '3', name: 'Jonas Pereira da Silva', initials: 'JP', role: 'Motorista · Linha 302', status: 'Atraso', time: '07:09' },
    { id: '4', name: 'Marina Duarte Reis', initials: 'MD', role: 'Manutenção · Oficina', status: 'Ausente', time: '—' },
    { id: '5', name: 'Ricardo Alves de Souza', initials: 'RA', role: 'Motorista · Linha 302', status: 'Presente', time: '07:18' },
    { id: '6', name: 'Simone Barbosa Cruz', initials: 'SB', role: 'Cobradora · Linha 118', status: 'Atraso', time: '07:22' },
    { id: '7', name: 'Wellington Faria', initials: 'WF', role: 'Motorista · Linha 044', status: 'Presente', time: '06:35' },
  ];
}

/// Segunda-feira da semana da data informada.
function startOfWeek(reference: Date): Date {
  const date = new Date(reference);
  // getDay(): 0 = domingo. Queremos a segunda como início, então o domingo
  // recua 6 dias em vez de avançar 1.
  const offset = date.getDay() === 0 ? -6 : 1 - date.getDay();
  date.setDate(date.getDate() + offset);
  return date;
}

function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/// "06:40 – 15:20" → "08:40", já descontando 1h de intervalo.
function durationOf(window: string): string {
  const [start, end] = window.split('–').map((part) => part.trim());
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const total = toMinutes(end) - toMinutes(start) - 60;
  const hours = Math.floor(total / 60);
  return `${String(hours).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

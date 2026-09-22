import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/tokens';

/*
 * Régua de 24 horas de um dia.
 *
 * Esta é a peça que dá ponto de vista ao app. Um espelho de ponto é uma lista
 * de horários — e lista de horários é o que todo app de ponto mostra. Mas a
 * pergunta que o motorista faz não é "quais foram os horários", é "como foi o
 * meu dia": começou cedo, quanto tempo ficou parado no intervalo, esticou à
 * noite.
 *
 * A régua responde isso na largura de uma linha de lista. Cada par de
 * marcações vira uma barra posicionada na proporção do dia; o olho lê a forma
 * antes de ler os números. Uma jornada 5h40–14h20 e uma 12h–20h20 têm a mesma
 * duração e desenhos completamente diferentes.
 *
 * A faixa de fundo mais escura marca 4h–22h, a janela em que a operação de
 * ônibus realmente acontece: ela dá a escala sem precisar de eixo numerado, e
 * faz a madrugada vazia parar de disputar atenção.
 */
export function ReguaDia({
  marcacoes,
  altura = 8,
  /// Marca a faixa 4h–22h, onde a operação de ônibus realmente acontece. Fora
  /// dela a régua fica mais apagada, para o olho não gastar atenção com a
  /// madrugada vazia.
  destacarOperacao = true,
}: {
  /// Horários `HH:MM` das marcações do dia, em ordem cronológica.
  marcacoes: string[];
  altura?: number;
  destacarOperacao?: boolean;
}) {
  const { c } = useTheme();

  // Pares entrada→saída. Um número ímpar de marcações significa jornada em
  // aberto: a última barra vai até o instante da última marcação e para —
  // desenhar até o fim do dia afirmaria um horário de saída que não existe.
  const blocos: { inicio: number; fim: number; aberto: boolean }[] = [];
  for (let i = 0; i < marcacoes.length; i += 2) {
    const inicio = fracaoDoDia(marcacoes[i]);
    const proxima = marcacoes[i + 1];
    if (proxima) {
      blocos.push({ inicio, fim: fracaoDoDia(proxima), aberto: false });
    } else {
      blocos.push({ inicio, fim: Math.min(inicio + 0.012, 1), aberto: true });
    }
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={descrever(marcacoes)}
      style={{
        height: altura,
        borderRadius: radius.pill,
        backgroundColor: c.line2,
        overflow: 'hidden',
      }}
    >
      {destacarOperacao ? (
        <View
          style={{
            position: 'absolute',
            left: `${(4 / 24) * 100}%`,
            width: `${(18 / 24) * 100}%`,
            top: 0,
            bottom: 0,
            backgroundColor: c.line,
          }}
        />
      ) : null}

      {blocos.map((bloco, indice) => (
        <View
          key={indice}
          style={{
            position: 'absolute',
            left: `${bloco.inicio * 100}%`,
            width: `${Math.max((bloco.fim - bloco.inicio) * 100, 1.2)}%`,
            top: 0,
            bottom: 0,
            backgroundColor: bloco.aberto ? c.warn : c.brandAction,
            borderRadius: radius.pill,
          }}
        />
      ))}
    </View>
  );
}

/// Eixo com as horas de referência. Fica abaixo da régua no detalhe do dia,
/// onde há espaço; na linha da lista a régua vai sozinha.
export function EixoRegua() {
  const { c } = useTheme();
  const horas = [0, 6, 12, 18, 24];

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
      {horas.map((hora) => (
        <Text key={hora} style={{ color: c.muted, fontFamily: fonts.mono, fontSize: 10 }}>
          {String(hora).padStart(2, '0')}h
        </Text>
      ))}
    </View>
  );
}

/// Posição da marcação no dia, de 0 (meia-noite) a 1.
///
/// Recebe `HH:MM` já no fuso local — que é como a API do espelho devolve.
/// Converter por `new Date()` reintroduziria o problema de fuso que o resto
/// do app tomou o cuidado de evitar.
function fracaoDoDia(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return (h * 60 + m) / (24 * 60);
}

/*
 * Descrição para leitor de tela.
 *
 * Uma barra colorida não diz nada no VoiceOver. `accessibility.md` pede que
 * informação transmitida visualmente tenha equivalente em texto — aqui, a
 * jornada em palavras.
 */
function descrever(marcacoes: string[]): string {
  if (marcacoes.length === 0) return 'Nenhuma marcação neste dia.';

  const partes: string[] = [];
  for (let i = 0; i < marcacoes.length; i += 2) {
    const fim = marcacoes[i + 1];
    partes.push(
      fim ? `de ${marcacoes[i]} a ${fim}` : `de ${marcacoes[i]}, em aberto`,
    );
  }
  return `Jornada ${partes.join('; ')}.`;
}

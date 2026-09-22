import { useWindowDimensions } from 'react-native';

/*
 * Suporte a Dynamic Type.
 *
 * O React Native já escala o texto com a preferência do sistema — o problema
 * do app era que os CONTÊINERES não escalavam junto: campos com `minHeight`
 * fixo cortavam o texto a 200%, e a linha de quatro células de horário na
 * home quebrava em três linhas.
 *
 * `typography.md › Supporting Dynamic Type` é explícito: *"Consider adjusting
 * your layout at large font sizes. When font size increases in a horizontally
 * constrained context, inline items can crowd text and cause truncation or
 * overlapping. To improve readability, consider using a stacked layout."*
 *
 * Daí os dois valores: `alturaMin` para caixas crescerem junto com o texto, e
 * `empilhar` para trocar linha por grade quando não cabe mais lado a lado.
 */
export function useScale() {
  const { fontScale, width } = useWindowDimensions();

  return {
    fontScale,
    /// A partir daqui, layouts horizontais apertados viram empilhados.
    empilhar: fontScale >= 1.35,
    /// Telas estreitas (iPhone SE e afins) somadas a texto grande.
    estreito: width < 380,
    /// Cresce uma altura fixa junto com o texto, com teto para a caixa não
    /// tomar a tela inteira nos tamanhos de acessibilidade.
    alturaMin: (base: number, teto = 1.6) => Math.round(base * Math.min(fontScale, teto)),
  };
}

/*
 * Teto de escala para rótulos que não devem crescer indefinidamente.
 *
 * O HIG abre exceção explícita para títulos de aba em
 * `typography.md › Conveying hierarchy`: *"when people increase text size to
 * read the content in a tabbed window, they don't expect the tab titles to
 * increase in size."* O mesmo vale para versaletes decorativos.
 */
export const TETO_ABA = 1.4;
export const TETO_ROTULO = 1.6;

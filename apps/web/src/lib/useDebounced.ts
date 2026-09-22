"use client";

import { useEffect, useState } from "react";

/*
 * Atrasa a propagação de um valor que muda a cada tecla.
 *
 * As buscas do painel disparavam uma requisição por caractere digitado:
 * "SILVA" eram cinco consultas ao Postgres, das quais quatro nasciam
 * obsoletas, e a tabela piscava a cada uma. Com 206 colaboradores e um
 * `ILIKE` sem índice do lado do servidor, isso é castigo gratuito.
 *
 * 300 ms é o intervalo em que uma pessoa digitando normalmente não percebe
 * atraso, mas que já agrupa a palavra inteira numa consulta só.
 */
export function useDebounced<T>(valor: T, ms = 300): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(timer);
  }, [valor, ms]);

  return atrasado;
}

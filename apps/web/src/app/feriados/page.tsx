"use client";

import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { PendingModule } from "@/components/PendingModule";

export default function HolidaysPage() {
  return (
    <Guard>
      <Shell title="Feriados" subtitle="Nacionais e municipais">
        <PendingModule
          icon="star"
          title="Cadastro de feriados"
          summary="A apuração já zera a carga prevista em feriado e sinaliza quem trabalhou. Os feriados nacionais de 2026 entram pelo seed; falta a tela para incluir os municipais e os pontos facultativos da empresa."
          endpoints={["GET/POST /holidays", "DELETE /holidays/:id"]}
          note="Municipais importam aqui: a operação atravessa Contagem, Ouro Preto e Cachoeira do Campo, que têm datas próprias."
        />
      </Shell>
    </Guard>
  );
}

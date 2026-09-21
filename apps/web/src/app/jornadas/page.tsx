"use client";

import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { PendingModule } from "@/components/PendingModule";

export default function SchedulesPage() {
  return (
    <Guard>
      <Shell title="Jornadas" subtitle="Turnos, escalas e carga prevista">
        <PendingModule
          icon="calendar"
          title="Cadastro de jornadas"
          summary="O modelo de dados já existe: jornada com tipo (fixa, flexível, 12x36), carga semanal, intervalo mínimo e horário por dia da semana. A apuração já consome isso — o que falta são os endpoints de CRUD na API."
          endpoints={[
            "GET/POST /work-schedules",
            "PATCH/DELETE /work-schedules/:id",
            "PUT /work-schedules/:id/days",
          ]}
          note="Enquanto isso, as jornadas podem ser criadas pelo seed ou direto no banco (npm run db:studio). O sistema atual da Turin chama isso de Horários — 'Escala eContador', 'Turin Manutenção', 'Guichê Cachoeira'."
        />
      </Shell>
    </Guard>
  );
}

"use client";

import { Guard } from "@/components/Guard";
import { Shell } from "@/components/Shell";
import { PendingModule } from "@/components/PendingModule";

export default function GeofencesPage() {
  return (
    <Guard>
      <Shell title="Perímetros" subtitle="Cercas virtuais das garagens">
        <PendingModule
          icon="pin"
          title="Cadastro de perímetros"
          summary="A cerca já funciona na marcação: o app envia a coordenada, a API calcula a distância por haversine e sinaliza quem bateu fora. Falta a tela para cadastrar as garagens — hoje isso vive só no banco."
          endpoints={["GET/POST /geofences", "PATCH/DELETE /geofences/:id"]}
          note="A cerca SINALIZA, nunca bloqueia. No cenário de ponto legal isso vira obrigação: a Portaria 671/2021 proíbe o REP-P de impedir o registro. Faltam também as coordenadas reais das garagens — Contagem, Ouro Preto e Cachoeira do Campo."
        />
      </Shell>
    </Guard>
  );
}

# Arquitetura

## Visão geral

```
┌─────────────────┐     ┌─────────────────┐
│  App iOS/Android│     │   Painel Web    │
│  (Expo/RN)      │     │   (Next.js)     │
└────────┬────────┘     └────────┬────────┘
         │  JWT (15 min) + refresh opaco  │
         └───────────────┬────────────────┘
                         ▼
              ┌─────────────────────┐
              │   API (NestJS)      │
              │   marcação, apuração│
              │   ajustes, sync     │
              └──────────┬──────────┘
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
┌───────────────┐ ┌─────────────┐  ┌───────────────┐
│  PostgreSQL   │ │  S3/MinIO   │  │  SQL Server   │
│  (dono do     │ │  (selfies)  │  │  RH — SOMENTE │
│   ponto)      │ │             │  │  LEITURA      │
└───────────────┘ └─────────────┘  └───────────────┘
```

## Por que dois bancos

O SQL Server do RH é a fonte da verdade do **cadastro**. O PostgreSQL é a fonte da
verdade do **ponto**. A separação resolve três problemas de uma vez:

- **Imutabilidade sob controle.** A tabela `punches` precisa de garantias (append-only,
  hash encadeado, NSR sem buraco) que exigem mandar no schema. Pedir DDL ao DBA do
  ERP a cada release não é viável.
- **Isolamento de falha.** Uma indisponibilidade do ERP não pode impedir alguém de
  bater o ponto.
- **Limitação técnica real.** O Prisma no provider `sqlserver` não suporta `enum`
  nem `Json` nativos — o modelo perderia expressividade sem ganhar nada.

O acoplamento fica num único ponto: `Employee.externalId`, que correlaciona o
funcionário local ao registro de origem. Nunca correlacione por nome.

## Fluxo de uma marcação

```
App                          API                        Postgres
 │                            │                             │
 │ 1. bate o ponto (offline   │                             │
 │    grava em fila local)    │                             │
 │                            │                             │
 │ 2. POST /punches ─────────►│                             │
 │    { clientId, punchedAt,  │ 3. clientId já existe?      │
 │      lat, lng, selfieKey } │    ──► sim: devolve original│
 │                            │                             │
 │                            │ 4. valida: relógio adiantado│
 │                            │    evidências exigidas,     │
 │                            │    intervalo mínimo, cerca  │
 │                            │                             │
 │                            │ 5. TRANSAÇÃO ──────────────►│
 │                            │    advisory lock (empresa)  │
 │                            │    NSR = último + 1         │
 │                            │    hash = sha256(prev|...)  │
 │                            │    INSERT punch             │
 │                            │    DELETE cache do dia      │
 │                            │    INSERT audit_log         │
 │                            │◄────────────────────────────│
 │ 6. comprovante ◄───────────│                             │
```

**Idempotência (passo 3)** é o que torna a fila offline segura: o app pode reenviar
a mesma marcação quantas vezes quiser sem duplicá-la.

**Advisory lock (passo 5)** serializa apenas as marcações da mesma empresa. Sem ele,
duas marcações simultâneas leriam o mesmo "último NSR" e a cadeia nasceria quebrada.

## Como se corrige um ponto sem alterá-lo

Esta é a decisão que mais afeta quem for mexer no código.

```
Marcação original (NSR 41, 08:47)   ← permanece na cadeia, para sempre
        ▲
        │ targetPunchId
        │
  PunchAdjustment (CHANGE_TIME, "bati atrasado por engano")
        │                    status: PENDING → APPROVED
        │ resultingPunchId
        ▼
Nova marcação (NSR 52, 08:00, source = ADJUSTMENT)
```

Na apuração, `TimesheetService` carrega os ajustes aprovados do período e monta:

- `disregardedPunchIds` — alvos de `REMOVE` e `CHANGE_TIME`, ignorados no cálculo
- `justifiedDates` — dias com `JUSTIFY_ABSENCE`, cuja carga prevista vira zero

O histórico completo continua auditável: dá para provar o que foi registrado, o que
foi pedido, quem aprovou e quando.

## Apuração

`day-calculator.ts` é uma **função pura** — recebe marcações e jornada, devolve
totais, não toca no banco. Isso permite recalcular qualquer período histórico sem
efeito colateral e testar as regras da CLT isoladamente (9 testes hoje).

Regras implementadas:

| Regra | Base |
|---|---|
| Pareamento por ordem cronológica | prática — o funcionário erra o botão |
| Tolerância de 10 min/dia zera o saldo | CLT art. 58 §1º |
| Intervalo mínimo em jornada > 6h | CLT art. 71 |
| Adicional noturno 22h–5h | CLT art. 73 §2º |
| Número ímpar de marcações → pendência | operacional |
| Jornada > 16h → pendência | operacional (saída não registrada) |

A conversão para a **hora noturna reduzida** de 52min30s (art. 73 §1º) é deixada
para a folha de pagamento: a apuração entrega minutos de relógio.

## Autenticação

| | Painel | App |
|---|---|---|
| Identificação | e-mail + senha (bcrypt, 12 rounds) | matrícula + PIN de 6 dígitos |
| 1º acesso | criado pelo admin | matrícula + CPF → define o PIN |
| Vínculo | — | `installationId` amarrado ao funcionário |
| Access token | JWT 15 min | JWT 15 min |
| Refresh token | opaco, 30 dias, rotacionado | idem |

O refresh token é **opaco** (bytes aleatórios com hash no banco), não um JWT, para
que "desconectar este aparelho" no painel funcione de verdade. A rotação detecta
reuso: se um token já rotacionado reaparece, todas as sessões do sujeito caem.

O vínculo de aparelho é o que impede dois colegas de baterem o ponto um do outro no
mesmo celular. "Troquei de celular" e "esqueci o PIN" resolvem-se por
`POST /employees/:id/reset-app-access`, que limpa o PIN, revoga os aparelhos e
derruba as sessões — o aparelho antigo, possivelmente perdido, deixa de valer.

## Caminho para o cenário A (ponto legal / REP-P)

O que já está pronto:

- NSR sequencial, único e ininterrupto por empresa
- Marcações imutáveis com hash encadeado e verificação de integridade
- Correções por ajuste vinculado, sem alterar o original
- Comprovante de registro devolvido a cada marcação
- Trilha de auditoria de tudo

O que falta:

- [ ] Exportação **AFD** assinada com certificado ICP-Brasil (e-CNPJ A1/A3)
- [ ] Exportação **AEJ** (apuração)
- [ ] Entrega formal do comprovante (impresso ou e-mail), com retenção
- [ ] `blockOutsideGeofence` obrigatoriamente `false` — o REP-P não pode impedir o registro
- [ ] Registro do programa no MTE: atestado técnico + termo de responsabilidade
- [ ] Política de retenção (marcações: 5 anos)

## LGPD

Selfie e geolocalização são dados pessoais; biometria facial é dado **sensível**
(art. 11). Antes de ir a produção:

- Base legal definida — para ponto, em regra *cumprimento de obrigação legal*, não
  consentimento (consentimento na relação de emprego é frágil por assimetria)
- Termo de privacidade exibido no primeiro acesso do app
- Retenção separada: marcações por 5 anos; selfies por prazo bem menor
- Criptografia em repouso no bucket de selfies
- Relatório de impacto (RIPD) antes de ligar reconhecimento facial

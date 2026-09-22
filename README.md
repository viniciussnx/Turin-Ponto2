# Turin Ponto

Sistema de marcação de ponto da **Turin Transportes**: aplicativo para iOS/Android,
painel web administrativo e API. Os funcionários vêm do **Alterdata Pack** por
sincronização somente leitura, através do mesmo proxy que o sistema de férias usa.

**Estágio atual:** cenário B — controle gerencial interno. O modelo de dados já é o
do cenário A (REP-P, Portaria MTP 671/2021), então a evolução para ponto legal é
configuração, não reescrita. Veja [docs/arquitetura.md](docs/arquitetura.md).

## Estrutura

```
apps/
  api/          NestJS + Prisma + PostgreSQL   ← implementado
  web/          Painel administrativo (Next.js 16) ← 12 telas
  mobile/       App do funcionário (Expo 57)    ← 17 telas
packages/
  shared/       Tipos e regras compartilhadas   ← a fazer
docs/
```

## Requisitos

- Node.js 20+ (testado no 24)
- PostgreSQL 14+
- Docker (opcional, apenas para subir o banco localmente)

## Subindo o ambiente

### 1. Banco de dados

**Com Docker:**

```bash
docker compose up -d postgres
```

**Sem Docker, na nuvem:** crie um banco gratuito no [Neon](https://neon.tech) ou
[Supabase](https://supabase.com) e use a connection string deles no passo seguinte.
Não é preciso instalar nada.

**Sem Docker, local:** baixe os binários do PostgreSQL 16 (zip, sem instalador) em
[get.enterprisedb.com](https://www.enterprisedb.com/download-postgresql-binaries) e
rode `initdb` você mesmo. Uma armadilha do Windows: **o `initdb` falha se o caminho
tiver acento** — ele aborta com `invalid byte sequence for encoding "UTF8"`. Um
diretório como `C:\Users\<nome com acento>\...` não serve, e o nome curto 8.3
não resolve, porque o Windows expande para o caminho longo. Use algo como
`C:\Users\Public\pg`.

### 2. Dependências e configuração

```bash
npm install
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env` e ajuste o `DATABASE_URL`. Gere um `JWT_SECRET` real:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Migrar e popular

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

O seed cria a empresa, a jornada padrão 44h, três funcionários de teste e os
feriados nacionais de 2026.

| Acesso | Credenciais |
|---|---|
| Painel web | `admin@turin.local` / `Turin@2026` |
| App | matrículas `1001`, `1002`, `1003` — gere a senha inicial em `POST /api/employees/:id/reset-app-access` |

### 4. Rodar

```bash
npm run api:dev   # API
npm run app       # app mobile (Expo)
```

- API: http://localhost:3333/api
- Swagger: http://localhost:3333/docs
- Health: http://localhost:3333/api/health

O app descobre o endereço da API pelo IP que o Metro anuncia, então funciona no
celular físico sem configuração. Para apontar para outro servidor, defina
`EXPO_PUBLIC_API_URL` em `apps/mobile/.env`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run api:dev` | API em modo watch |
| `npm run app` | Expo dev server (Expo Go ou build de desenvolvimento) |
| `npm run web` | Painel administrativo em http://localhost:3000 |
| `npm run db:migrate` | Cria/aplica migração de desenvolvimento |
| `npm run db:deploy` | Aplica as migrações existentes, sem criar nenhuma (produção) |
| `npm run db:seed` | Popula dados iniciais (idempotente) |
| `npm run db:studio` | Prisma Studio, para inspecionar o banco |
| `npm test --workspace @turin/api` | Testes |

## Integração com o Alterdata (cadastro de funcionários)

A sincronização é **somente leitura**: o ERP continua dono do cadastro, e este
sistema é dono do ponto. Configure em `apps/api/.env`:

```env
EMPLOYEE_SYNC_ENABLED=true
PROXY_API_URL=https://proxy-analista-dp.up.railway.app/api
PROXY_API_KEY=...
ALTERDATA_EMPRESA=00001
```

Consumimos `GET /empresas/{cod}/funcionarios` do **proxy Analista-DP** — a mesma
porta de entrada que o `turin-ferias` usa. Um único ponto de integração com o ERP
vale mais que duas conexões diretas ao Postgres do Alterdata: quando o schema
`wdp` mudar, só o proxy precisa acompanhar.

Campos mapeados (nomes do Alterdata Pack, tabela `f{cod}`):

| Campo local | Origem |
|---|---|
| `externalId` | `idfuncionario` |
| `registration` | `cdchamada` (matrícula) |
| `name` | `nmfuncionario` |
| `position` | `funcoesb.nmfuncao` |
| `department` | `depto.nmdepartamento` |
| `admittedAt` / `terminatedAt` | `dtadmissao` / `dtdemissao` |

O ERP guarda tudo em CAIXA ALTA; a sincronização capitaliza nomes e cargos antes
de gravar. **CPF e PIS ainda não vêm do proxy** — ficam nulos até a API entregá-los.

Dispare com `POST /api/sync/employees`. Sem acesso ao proxy, use
`POST /api/sync/employees/csv`, que aceita cabeçalhos em português (`matricula`,
`nome`, `cargo`, `departamento`, `admissao`, `demissao`, `situacao`) ou inglês.

> **Praças:** o Alterdata devolve um único departamento "Operação" para os 126
> motoristas — não separa Ouro Preto de Cachoeira do Campo. O `turin-ferias`
> contorna com uma lista de matrículas em `server/lotacao.js`. Para as cercas
> geográficas do ponto, isso precisa ser resolvido: ou a API passa a devolver a
> praça, ou replicamos a lista aqui.

## Endpoints principais

| Método | Rota | Quem usa |
|---|---|---|
| `POST` | `/api/auth/login` | Painel |
| `POST` | `/api/auth/employee/login` | App — matrícula + senha + aparelho |
| `POST` | `/api/auth/employee/change-password` | App — troca obrigatória no 1º acesso |
| `POST` | `/api/employees/:id/reset-app-access` | Painel — gera senha inicial e revoga aparelhos |
| `POST` | `/api/punches` | App — registra marcação (idempotente por `clientId`) |
| `GET` | `/api/timesheet/me` | App — espelho do mês |
| `POST` | `/api/adjustments` | App/Painel — pede correção |
| `PATCH` | `/api/adjustments/:id/review` | Painel — aprova/rejeita |
| `GET` | `/api/timesheet/inconsistencies` | Painel — fila de pendências do RH |
| `GET` | `/api/punches/chain/verify` | Painel — auditoria de integridade |
| `POST` | `/api/sync/employees` | Painel — sincroniza com o Alterdata |

Lista completa e schemas no Swagger.

## Decisões que valem conhecer antes de mexer

1. **Marcação nunca é alterada nem apagada.** A tabela `punches` é append-only.
   Correções são `punch_adjustments`; aprovar um ajuste cria uma marcação nova e
   faz a apuração ignorar a antiga, que permanece na base para auditoria.

2. **Cada marcação carrega hash encadeado + NSR.** Alterar uma linha direto no
   banco quebra a cadeia de todas as seguintes, e `GET /api/punches/chain/verify`
   aponta exatamente onde. É o que dá valor probatório ao registro.

3. **O pareamento do dia é por ordem cronológica, não pelo botão apertado.** O
   funcionário erra o botão o tempo todo; a sequência temporal não mente.

4. **A geolocalização sinaliza, não bloqueia** (`blockOutsideGeofence = false`).
   No cenário A isso vira obrigação legal: o REP-P não pode impedir o registro.

5. **`DayTimesheet` é cache.** Pode ser apagada e recalculada a qualquer momento a
   partir de `punches` + jornada. Nenhuma decisão depende dela.

## Próximos passos

- [x] Painel web: hoje, marcações, ajustes, espelho, colaboradores, sincronização, auditoria
- [ ] Painel web: CRUD de jornadas, perímetros e feriados (falta a API)
- [x] App mobile: as 17 telas do protótipo
- [ ] Backend para escala/turno/linha/veículo, notificações e presença de equipe (hoje provisórios no app)
- [ ] Upload de selfie para S3/MinIO
- [ ] Job agendado de sincronização (hoje é sob demanda)
- [ ] Exportação de relatórios (CSV/PDF)
- [ ] LGPD: política de privacidade, termo no app, política de retenção

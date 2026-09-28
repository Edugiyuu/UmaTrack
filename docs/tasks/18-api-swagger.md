# Task 18 — Documentar a API com Swagger (OpenAPI 3.1)

| Campo | Valor |
|---|---|
| **ID** | `18` |
| **Branch** | `feat/api-swagger` |
| **Base** | `main` |
| **Status** | 🔍 Em revisão |
| **Tamanho** | M (1–2 sessões) |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | backend · docs |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
A API tem 18 operações (17 nos arquivos de rotas mais o `GET /` do `app.ts`), e a única referência delas é uma tabela de 10 linhas na
seção 7 de [`docs/race-system-design.md`](../race-system-design.md). Essa tabela não
traz corpo de requisição, formato de resposta nem códigos de erro, e já está
desatualizada em mais de um ponto:

- A seção 4.7 do mesmo arquivo cita `POST /races`, mas a rota real é `POST /race/run`.
- A seção 5 ainda diz que skills têm `requirements` de atributo (removidos na task 16).
- A seção 6 mostra `SP = round(ganho * 0.4)`, mas o código usa `0.45`.
- Faltam na tabela: `POST /user/create`, `POST /user/login`, `GET /verify-token`,
  `GET /user/me`, `POST /user/me/purchase-horse`, `GET /horse` e `GET /horse/:id`.

Quem mexe no frontend hoje descobre o contrato lendo o controller. As respostas
também não seguem um padrão: a maioria usa `{ msg }`, mas `horseController` e parte do
`userController` usam `{ error }`, e o login responde **422** tanto para usuário
inexistente quanto para senha errada. Nada disso está escrito em lugar nenhum.

## 2. Objetivo
Com o backend rodando, `http://localhost:3000/docs` abre um Swagger UI com **todas** as
rotas, cada uma com parâmetros, corpo, respostas de sucesso e de erro, exemplos reais e
autenticação JWT funcionando no "Authorize". Um script de verificação falha se alguém
criar uma rota sem documentá-la.

## 3. Escopo

### Dentro do escopo
- [x] Especificação **OpenAPI 3.1** escrita em TypeScript (`backend/src/docs/openapi/`), com
      `components.schemas` para todos os modelos que a API devolve.
- [x] **Swagger UI** servido em `GET /docs` e o JSON cru em `GET /openapi.json`.
- [x] Esquema de segurança `bearerAuth` (JWT) aplicado às rotas protegidas.
- [x] Documentação de **todas as 18 operações** listadas na seção 4.3, **como elas se
      comportam hoje** (inclusive as inconsistências, marcadas como tal).
- [x] Exemplos de requisição e resposta com valores reais (tirados dos catálogos em
      `backend/src/data/` e de uma simulação offline do motor).
- [x] Script `npm run docs:check` que compara as rotas registradas no Express com os
      paths da spec e falha se houver diferença.
- [x] Variável de ambiente `API_DOCS` para ligar ou desligar `/docs` e `/openapi.json`.
- [x] Corrigir as referências desatualizadas em `docs/race-system-design.md` (seções 4.7, 5,
      6 e 7) e apontar a seção 7 para o Swagger.

### Fora do escopo
- **Mudar o comportamento da API.** A task documenta o que existe. Os problemas
  encontrados vão para a seção 9 e viram tasks próprias:
  - padronizar o formato de erro (`{ msg }` vs `{ error }`);
  - `getHorse` sem `return` no 404 (ver seção 9);
  - login responder 401 em vez de 422 para credenciais inválidas;
  - remover ou rotear `postHorses`, `patchHorse`, `update` e `remove`, que existem nos
    controllers mas não têm rota.
- Validação de entrada **gerada** a partir da spec (ex.: `express-openapi-validator`). Pode
  vir depois, mas mudaria respostas de erro, e isso é mudança de comportamento.
- Gerar o cliente do frontend a partir da spec (ex.: `openapi-typescript`). Fica como
  sugestão na seção 9.
- Documentar o formato do replay no frontend. A spec descreve o JSON; como a UI o anima
  continua em `docs/race-system-design.md`.

## 4. Abordagem técnica

### 4.1 Decisão: spec escrita à mão em TypeScript + `swagger-ui-express`

Foram consideradas três abordagens:

| Abordagem | Prós | Contras | Decisão |
|---|---|---|---|
| **`swagger-jsdoc`** (YAML dentro de comentários `@openapi` nos controllers) | Doc perto do código | YAML em comentário não tem checagem de tipo nem autocomplete; erros de indentação só aparecem em runtime; os controllers já são longos | ❌ |
| **Arquivo `openapi.yaml` único** | Padrão, fácil de ler | Arquivo de 1500+ linhas; sem reaproveitar as constantes do código (`RUNNING_STYLES`, `SKILL_EFFECT_KINDS`…), então os `enum` ficam desatualizados | ❌ |
| **Spec como objeto TypeScript**, dividida por domínio | Tipada (`OpenAPIV3_1.Document`), importa os `enum` direto dos models, erros aparecem no `tsc`, um arquivo por tag | Um pouco mais verbosa que YAML | ✅ |

Os `enum` da spec **importam as constantes dos models** (`RUNNING_STYLES`,
`CAREER_STATUSES`, `SKILL_EFFECT_KINDS`, `SKILL_PHASES`, `SKILL_TERRAINS`,
`SKILL_RARITIES`, `TRACK_SURFACES`, `TRACK_TERRAINS`, `TRACK_CATEGORIES`, `TRAIN_TYPES`).
Se alguém acrescentar um valor no model, a documentação acompanha sozinha.

**Dependências novas** (verificar a versão estável mais recente na hora de instalar e se
é compatível com Express 5):

```bash
npm install swagger-ui-express --prefix backend
npm install -D @types/swagger-ui-express openapi-types --prefix backend
```

`openapi-types` só fornece os tipos `OpenAPIV3_1.*`; não tem código em runtime.

### 4.2 Estrutura de arquivos

```
backend/src/docs/
├── openapi/
│   ├── index.ts          # monta o Document: info, servers, tags, security, junta paths e schemas
│   ├── schemas.ts        # components.schemas (seção 4.5)
│   ├── responses.ts      # respostas reutilizáveis: Unauthorized, NotFound, ServerError…
│   ├── examples.ts       # exemplos grandes (simulação de corrida, usuário com éguas)
│   └── paths/
│       ├── auth.ts       # /user/create, /user/login, /verify-token
│       ├── user.ts       # /user/me, /user/me/purchase-horse
│       ├── horses.ts     # /horse, /horse/{id}
│       ├── ownedHorse.ts # /user/me/horses/{horseId}, /train, /rest, /new-career, /skills
│       ├── tracks.ts     # /track, /track/{id}
│       ├── skills.ts     # /skill
│       └── races.ts      # /race/run, /user/me/races
└── swagger.ts            # registra /docs e /openapi.json no app

backend/src/scripts/openapiCheck.ts   # npm run docs:check
```

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/package.json` | editar | Dependências novas; script `docs:check` |
| `backend/src/docs/**` | criar | A spec e o registro do Swagger UI |
| `backend/src/scripts/openapiCheck.ts` | criar | Verificação rota × spec |
| `backend/src/app.ts` | editar | Chamar `mountApiDocs(app)` antes de `app.use(routes)` |
| `backend/.env.example` | criar ou editar | Documentar `API_DOCS` e `PUBLIC_API_URL` |
| `docs/race-system-design.md` | editar | Corrigir 4.7, 5, 6 e 7 |
| `README.md` | editar | Como abrir o Swagger. **Atenção: o README é UTF-16** (ver seção 9) |
| `docs/tasks/README.md` | editar | Linha 18 na tabela |

### 4.3 Inventário completo das rotas

Levantado de `backend/src/routes/*.ts` e dos controllers em 2026-09-27. **Auth** = exige
`Authorization: Bearer <token>` (middleware `authMiddleware`).

| # | Método | Path (Express) | Path (OpenAPI) | Auth | Controller | Tag |
|---|---|---|---|---|---|---|
| 1 | GET | `/` | `/` | — | inline em `app.ts` | Sistema |
| 2 | POST | `/user/create` | `/user/create` | — | `userController.create` (+ `encryptPassword`) | Auth |
| 3 | POST | `/user/login` | `/user/login` | — | `userController.login` | Auth |
| 4 | GET | `/verify-token` | `/verify-token` | ✅ | inline em `userRoutes.ts` | Auth |
| 5 | GET | `/user/me` | `/user/me` | ✅ | `userController.getUser` | Usuário |
| 6 | POST | `/user/me/purchase-horse` | `/user/me/purchase-horse` | ✅ | `userController.purchaseHorse` | Usuário |
| 7 | GET | `/horse` | `/horse` | — | `horseController.getAllHorses` | Catálogo de éguas |
| 8 | GET | `/horse/:id` | `/horse/{id}` | — | `horseController.getHorse` | Catálogo de éguas |
| 9 | GET | `/user/me/horses/:horseId` | `/user/me/horses/{horseId}` | ✅ | `userController.getOwnedHorse` | Égua do usuário |
| 10 | POST | `/user/me/horses/:horseId/train` | `…/{horseId}/train` | ✅ | `userController.trainHorse` | Treino e carreira |
| 11 | POST | `/user/me/horses/:horseId/rest` | `…/{horseId}/rest` | ✅ | `userController.restHorse` | Treino e carreira |
| 12 | POST | `/user/me/horses/:horseId/new-career` | `…/{horseId}/new-career` | ✅ | `userController.startNewCareer` | Treino e carreira |
| 13 | POST | `/user/me/horses/:horseId/skills` | `…/{horseId}/skills` | ✅ | `skillController.learnSkill` | Skills |
| 14 | GET | `/skill` | `/skill` | — | `skillController.getAllSkills` | Skills |
| 15 | GET | `/track` | `/track` | — | `trackController.getAllTracks` | Pistas |
| 16 | GET | `/track/:id` | `/track/{id}` | — | `trackController.getTrack` | Pistas |
| 17 | POST | `/race/run` | `/race/run` | ✅ | `raceController.runRace` | Corrida |
| 18 | GET | `/user/me/races` | `/user/me/races` | ✅ | `raceController.getRaceHistory` | Corrida |

`GET /` e `GET /verify-token` são handlers inline, sem controller; mesmo assim entram na
spec. O `docs:check` deve encontrar **18 operações**. `/docs` e
`/openapi.json` não entram na spec (o check os ignora).

> **Convenção de path:** o Express usa `:param`, o OpenAPI usa `{param}`. O `docs:check`
> converte um no outro antes de comparar.

### 4.4 Rota a rota (tin tin por tin tin)

Formato de erro padrão, usado em quase todas as rotas: `{ "msg": string }`, às vezes com
campos extras (`required`, `available`, `trackSlug`). A spec define o schema `Error` com
`msg` obrigatório e `additionalProperties: true`, e um `ErrorLegacy` com `error` para as
rotas que usam essa chave (marcadas com ⚠️ abaixo).

Toda rota protegida pode devolver, além do que está listado:
- **401** `{ msg: "Acesso negado: token não fornecido." }` sem header, ou
  `{ msg: "Token inválido." }` com token expirado, malformado ou sem `id`/`userName`.
- **500** `{ msg: "Configuração de autenticação ausente." }` se `SECRET_KEY` não estiver
  definida.

Defina esses dois como `components.responses.Unauthorized` e
`components.responses.AuthMisconfigured` e referencie em todas as rotas com `bearerAuth`.

---

#### 1. `GET /` — health check
- **Resposta 200:** `text/plain`, corpo `Hello, World!`.
- **Nota:** não é JSON. Documentar como está; útil como ping.

---

#### 2. `POST /user/create` — cadastrar usuário
- **Middleware:** `encryptPassword` aplica bcrypt (salt 12) em `password` antes do controller.
- **Body (JSON, obrigatório):**
  ```json
  { "username": "Eduardo", "email": "edu@example.com", "password": "segredo123" }
  ```
  `email` é normalizado (`trim` + minúsculas); `username` sofre `trim`. **Não há regra de
  tamanho ou formato de senha nem validação de formato de e-mail** — registrar isso na
  descrição.
- **O que acontece:** sorteia **uma égua aleatória do catálogo** e cria o usuário com ela
  (carreira ativa, `turnsLeft` = turnos da 1ª prova do calendário dela) e `monies: 1000`.
- **Respostas:**
  | Código | Corpo | Quando |
  |---|---|---|
  | 201 | `{ msg: "USER_MESSAGES.USER_SAVED_SUCCESSFULLY", user: User }` (sem `password`) | Criado |
  | 422 | `{ msg: "USER_MESSAGES.EMAIL_AND_PASSWORD_AND_USERNAME_REQUIRED" }` | Falta campo |
  | 422 | `{ msg: "Esse Email já está em uso" }` | E-mail repetido |
  | 404 | `{ msg: "Cavalo não encontrado" }` | Catálogo de éguas vazio |
  | 500 | `{ msg: "USER_MESSAGES.ERROR_SAVING_USER" }` | Erro ao salvar |
- **Nota:** as mensagens `USER_MESSAGES.*` são chaves, não texto; documentar como tal.

---

#### 3. `POST /user/login` — autenticar
- **Body:** `{ "email": string, "password": string }`.
- **Resposta 200:** `{ msg: "Autenticação feita com sucesso", token: string, id: string }`.
  O token é um JWT HS256 assinado com `SECRET_KEY`, **expira em 1 hora**, payload
  `{ id, userName }`. Descrever isso no `description` do `bearerAuth`.
- **Erros:** 422 `O email é obrigatório` · 422 `A senha é obrigatória` · 422 `Usuário não
  encontrado` · 422 `Senha inválida` · 500 `Configuração de autenticação ausente` / `Algum
  erro ocorreu`.
- ⚠️ Documentar que credencial errada responde **422**, não 401.

---

#### 4. `GET /verify-token` 🔒
- **Resposta 200:** `{ valid: true, user: { id, userName, iat, exp } }` (o payload
  decodificado do JWT).
- Uso: o frontend checa se a sessão guardada ainda vale.

---

#### 5. `GET /user/me` 🔒 — perfil
- **Resposta 200:** o documento `User` **sem `password`**: `_id`, `username`, `email`,
  `monies`, `createdAt`, `updatedAt`, `horses[]`. Cada item de `horses` é um `OwnedHorse`
  cru (subdocumento, `_id` = id **da cópia**) com `career` substituído por `CareerView`
  quando existe.
- **Erros:** ⚠️ 401 `{ error: "USER_MESSAGES.UNAUTHORIZED" }` · ⚠️ 404
  `{ error: "USER_MESSAGES.USER_NOT_FOUND" }` · 500 `{ msg: "USER_MESSAGES.ERROR_GETTING_USER" }`.
- **Atenção na spec:** aqui `horses[]._id` é o id da **cópia**; nas rotas de égua do
  usuário (9–13), `_id` é o id do **catálogo**. Documentar a diferença explicitamente
  nos dois schemas (`UserOwnedHorse` e `OwnedHorse`).

---

#### 6. `POST /user/me/purchase-horse` 🔒 — comprar égua
- **Body:** `{ "horseId": "<ObjectId do catálogo>" }`.
- **O que acontece:** operação atômica (`findOneAndUpdate` com `monies >= cost` e sem
  cópia com o mesmo nome/id) que desconta o preço e cria a cópia com carreira nova.
- **Respostas:**
  | Código | Corpo | Quando |
  |---|---|---|
  | 200 | `{ msg: "Cavalo comprado com sucesso!", user: User, purchasedHorse: Horse }` | Comprou |
  | 422 | `Horse ID é obrigatório` | Ausente ou não é ObjectId |
  | 422 | `Preço do cavalo inválido` | `cost` ≤ 0 no catálogo |
  | 404 | `Cavalo não encontrado` / `Usuário não encontrado` | |
  | 409 | `Cavalo já pertence ao usuário` | Já tem (inclusive aposentada) |
  | 400 | `{ msg: "Dinheiro insuficiente", required, available }` | Sem dinheiro |
  | 500 | `Erro interno do servidor` | |

---

#### 7. `GET /horse` — catálogo de éguas
- **Resposta 200:** `Horse[]` (`_id`, `name`, `passiveBuff`, `speed`, `stamina`, `power`,
  `wit`, `cost`, `createdAt`, `updatedAt`).
- ⚠️ 500 `{ error: "Erro interno." }`.
- **Nota na descrição:** `passiveBuff` é só texto de loja; nenhum código o aplica.

#### 8. `GET /horse/{id}` — uma égua do catálogo
- **Path:** `id` = ObjectId.
- **Respostas:** 200 `Horse` · ⚠️ 404 `{ error: "Cavalo não encontrado." }` · ⚠️ 500
  `{ error: "Erro interno." }` (inclusive quando `id` não é um ObjectId válido: o
  `findById` lança `CastError`).
- ⚠️ Ver o bug do 404 na seção 9.

---

#### 9. `GET /user/me/horses/{horseId}` 🔒 — égua do usuário
- **Path:** `horseId` = **id do catálogo** (não o da cópia). Se ela tiver várias cópias,
  vem a da carreira ativa; sem ativa, a aposentada mais recente.
- **Resposta 200:** `OwnedHorse` serializado: todos os campos da cópia + `_id` (catálogo),
  `ownedHorseId` (cópia), `sourceHorseId`, `cost` e `career: CareerView`.
- **Efeito colateral a documentar:** éguas antigas sem campos novos são completadas e
  salvas na primeira leitura (`normalizeOwnedHorse`). Um GET pode escrever no banco.
- **Erros:** 404 `Cavalo não pertence ao usuário` (inclui `horseId` que não é ObjectId) ·
  500 `Erro ao buscar cavalo do usuário`.

#### 10. `POST /user/me/horses/{horseId}/train` 🔒 — treinar
- **Body:**
  ```json
  { "trainType": "stamina", "score": 10, "maxScore": 10 }
  ```
  | Campo | Tipo | Regra |
  |---|---|---|
  | `trainType` | enum `TRAIN_TYPES` | obrigatório |
  | `score` | number | 0 ≤ score ≤ maxScore; obrigatório (ou `points`) |
  | `maxScore` | number | 0 < maxScore ≤ 50; **padrão 10** |
  | `points` | number | **deprecated**: nome antigo de `score`. Marcar `deprecated: true` |
- **Resposta 200:** `{ horse: OwnedHorse, training: TrainingOutcome }` com
  `TrainingOutcome = { statGain, skillPointsGained, energySpent, moodChange, failed, notes[] }`.
- **Descrição deve resumir a fórmula** (ou linkar o PDF de mecânicas) e dizer que a
  pontuação é o único dado confiado ao cliente.
- **Erros:** 422 `Tipo de treino inválido` · 422 `Pontuação de treino inválida` · 404
  `Cavalo não pertence ao usuário` · 409 `A carreira dela terminou.` · 409 `Os turnos
  acabaram: agora é a prova da carreira.` · 500 `Erro ao salvar treino`.

#### 11. `POST /user/me/horses/{horseId}/rest` 🔒 — descansar
- **Body:** nenhum.
- **Resposta 200:** `{ horse: OwnedHorse, rest: { energyRecovered, energy, mood, turnSpent } }`.
  `turnSpent` é `false` quando ela já estava com 0 turnos (descansar continua permitido
  para não travar a prova obrigatória).
- **Erros:** 404 · 409 `A carreira dela terminou.` · 409 `Ela já está descansada` (energia
  100) · 500 `Erro ao descansar`.

#### 12. `POST /user/me/horses/{horseId}/new-career` 🔒 — nova carreira
- **Body:** nenhum. Gratuito.
- **Resposta 201:** `{ horse: OwnedHorse }` (a cópia nova, com atributos de catálogo).
- **Erros:** 404 · 409 `Ela já está numa carreira.` · 500 `Erro ao começar nova carreira`.

#### 13. `POST /user/me/horses/{horseId}/skills` 🔒 — aprender skill
- **Body:** `{ "skillId": "<ObjectId ou slug>" }`. Aceita os dois: documentar com
  exemplos `"steady-breathing"` e um ObjectId.
- **Resposta 200:** `{ msg: "Skill aprendida!", skill: Skill, horse: OwnedHorse }`.
- **Erros:** 422 `Skill é obrigatória` · 404 `Skill não encontrada` · 404 `Cavalo não
  pertence ao usuário` · 409 `A carreira dela terminou.` · 409 `Skill já aprendida` · 409
  `{ msg: "Skill points insuficientes", required, available }` · 500 `Erro ao aprender skill`.
- **Nota:** aprender skill **não gasta turno**.

---

#### 14. `GET /skill` — catálogo de skills
- **Resposta 200:** `Skill[]` ordenado por `cost` e depois `name`.
- **Descrição de `effect.value`**: a unidade depende de `effect.kind` (m/turno,
  multiplicador, fração, pontos). Copiar a tabela da seção 9 do PDF de mecânicas.
  Avisar que `inclineBoost` não tem efeito no motor atual.
- **Erro:** 500 `Erro ao buscar skills.`

#### 15. `GET /track` — catálogo de pistas
- **Resposta 200:** `Track[]` ordenado por `difficulty` e `distance`. Inclui o virtual
  `maxGrade` e `id` (o `toJSON` com `virtuals: true` acrescenta `id` além de `_id`).
- **Descrição:** `statWeights` e `grade` são legado; o motor por turnos não os usa.
- **Erro:** 500 `Erro ao buscar pistas.`

#### 16. `GET /track/{id}` — uma pista
- **Path:** `id` = ObjectId **ou slug** (ex.: `niigata-mile`). Documentar os dois exemplos.
- **Respostas:** 200 `Track` · 404 `Pista não encontrada.` · 500 `Erro ao buscar pista.`

---

#### 17. `POST /race/run` 🔒 — correr
- **Body:**
  ```json
  { "horseId": "<ObjectId do catálogo>", "trackId": "niigata-mile", "runningStyle": "pace" }
  ```
  `trackId` aceita ObjectId ou slug. `runningStyle` é opcional; se vier, é **gravado na
  égua**. Documentar que o estilo hoje **não afeta a simulação**.
- **Pré-condições, na ordem em que o controller checa** (a ordem importa para saber qual
  erro sai primeiro):
  1. 422 `Cavalo e pista são obrigatórios`
  2. 422 `Estilo de corrida inválido`
  3. 404 `Pista não encontrada`
  4. 404 `Cavalo não pertence ao usuário`
  5. 409 `A carreira dela terminou. Comece uma nova carreira para correr.`
  6. 409 `{ msg: "Os turnos acabaram: agora é a prova da carreira, <pista>.", trackSlug }`
     — com 0 turnos, só a pista da carreira é aceita
  7. 409 `{ msg: "Energia insuficiente para correr. Descanse antes da prova.", required: 35, available }`
  8. 400 `{ msg: "Dinheiro insuficiente para a inscrição", required, available }`
- **Resposta 200:**
  ```ts
  {
    msg: "Vitória!" | "Corrida concluída",
    simulation: RaceSimulation,
    rewards: {
      placement, prizeMoney, entryFee, skillPointsEarned, fansEarned,
      energySpent: 35, turnsLeft,
      career: CareerOutcome | null   // null em prova avulsa
    },
    horse: OwnedHorse,
    monies: number
  }
  ```
- **`RaceSimulation`** é o maior schema da API. Documentar cada campo, com as unidades:
  `seed`, `trackSlug`, `distance`, `runners[]` (com `isRival`), `rivals[]` (as 3 rivais montadas sobre a égua do jogador, task 19), `frames[]` (`t` em turnos, 4 por turno,
  `positions` em metros na ordem de `runners`, `stamina` 0..1), `results[]`,
  `activations[]` (`time` = turno contado de 0), `shortfalls` (objeto indexado pelo id da
  corredora), `telemetry[]` (`RunnerTelemetry`, 17 campos, ver
  `backend/src/types/race.ts`).
- **`CareerOutcome`** é uma união discriminada por `kind`: use `oneOf` +
  `discriminator: { propertyName: "kind" }` com os três formatos (`passed` traz `next`).
- **Exemplo:** o exemplo de 200 deve ser uma simulação real, gerada offline com o motor
  (sem banco) e **cortada** (3 corredoras, 8 frames, 3 itens de telemetria) para não pesar
  o Swagger UI. Registrar a seed usada.
- **Efeitos colaterais a listar na descrição:** desconta energia e inscrição, paga
  prêmio, soma SP e fãs, altera humor, consome 1 turno (avulsa) ou avança/encerra a
  carreira, grava um `RaceResult`.
- **Erro:** 500 `Erro ao simular corrida`.

#### 18. `GET /user/me/races` 🔒 — histórico
- **Query:** `limit` (1–50, padrão 20), `skip` (≥ 0, padrão 0). Valores inválidos caem no
  padrão (não dão erro). Documentar `minimum`/`maximum`/`default`.
- **Resposta 200:** `{ races: RaceResult[], total, limit, skip }`, mais recentes primeiro.
- `RaceResult.timeUnit`: `"turns"` para corridas do motor atual, `"seconds"` para as
  antigas. `finishTime` está na unidade de `timeUnit`.
- **Erros:** 401 · 500 `Erro ao buscar histórico de corridas`.

### 4.5 `components.schemas`

Cada schema com `description` em português e `example`. Campos obrigatórios em
`required`. Números com `minimum`/`maximum` quando o model define (`energy` 0–100,
`mood` 1–5, `curve` 0–1, `grade` −12–12, `baseChance` 0–1 etc.).

| Schema | Origem no código | Observações |
|---|---|---|
| `Error` | controllers | `msg` + `additionalProperties` |
| `ErrorLegacy` | horse/user controllers | `error` |
| `StatBlock` | `types/race.ts` | speed, stamina, power, wit |
| `Horse` | `models/horse.ts` | catálogo |
| `LearnedSkill` | `models/user.ts` | skillId, slug, name, learnedAt |
| `CareerRace` | `services/career.ts` (`CareerRaceView`) | index, trackSlug, trackName, turnsBefore, goal |
| `CareerResult` | `models/user.ts` | |
| `CareerView` | `careerView()` | status, raceIndex, races, results, endedAt, nextRace, raceDue |
| `CareerOutcome` | `career.ts` | `oneOf` com discriminator |
| `OwnedHorse` | `serializeOwnedHorse()` | `_id` = catálogo, `ownedHorseId` = cópia |
| `UserOwnedHorse` | `getUser` | `_id` = cópia |
| `User` | `models/user.ts` | **sem** `password` |
| `TrackSegment`, `Track` | `models/track.ts` | + `maxGrade`, `id` |
| `SkillEffect`, `SkillTrigger`, `Skill` | `models/skill.ts` | |
| `TrainingOutcome`, `RestOutcome` | `trainingEngine.ts`, `restHorse` | |
| `RaceFrame`, `RaceRunnerResult`, `SkillActivation`, `RunnerTelemetry`, `RivalProfile`, `RaceSimulation` | `types/race.ts` | copiar os comentários JSDoc como `description` |
| `RaceRewards`, `RaceRunResponse` | `runRace` | |
| `RaceResult`, `RaceHistory` | `models/raceResult.ts`, `getRaceHistory` | |

Datas: `type: string, format: date-time`. ObjectIds: `type: string, pattern: ^[a-f\d]{24}$`
(schema reutilizável `ObjectId`).

### 4.6 Montagem no app

```ts
// backend/src/docs/swagger.ts
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiDocument } from "./openapi";

/** Docs are on unless API_DOCS=false. */
export const mountApiDocs = (app: Express) => {
  if (process.env.API_DOCS === "false") return;

  const document = buildOpenApiDocument();
  app.get("/openapi.json", (_req, res) => res.json(document));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(document, {
    swaggerOptions: { persistAuthorization: true }
  }));
};
```

```ts
// backend/src/app.ts (trecho)
app.use(express.json());
app.use(cors());
mountApiDocs(app);   // antes das rotas
app.use(routes);
```

`servers`: `[{ url: process.env.PUBLIC_API_URL ?? "http://localhost:3000" }]`.

`securitySchemes`:

```ts
bearerAuth: {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Token de POST /user/login. Expira em 1 hora. Payload: { id, userName }."
}
```

### 4.7 O `docs:check`

```jsonc
// backend/package.json
"docs:check": "ts-node --compilerOptions {\\\"module\\\":\\\"CommonJS\\\"} src/scripts/openapiCheck.ts"
```

O script **não** sobe o servidor nem conecta no banco. Ele:

1. Importa `routes` (`src/routes/index.ts`) e percorre `router.stack` recursivamente
   (layers com `route` são rotas; layers com `handle.stack` são sub-routers) coletando
   `MÉTODO path`. Soma as duas rotas inline de `app.ts` (`GET /`) numa lista fixa, com
   comentário explicando por quê.
2. Converte `:param` → `{param}`.
3. Monta a spec com `buildOpenApiDocument()` e coleta `MÉTODO path` de `paths`.
4. Imprime o que está só no Express (**rota sem documentação**) e o que está só na spec
   (**documentação de rota que não existe**) e sai com código 1 se qualquer lista não
   estiver vazia.
5. Checagens extras, baratas e úteis:
   - toda operação tem `summary`, `tags` e pelo menos uma resposta 2xx;
   - toda rota que usa `authMiddleware` tem `security: [{ bearerAuth: [] }]` e vice-versa
     (dá para detectar pelo nome da função na layer: `layer.route.stack[i].name === "authMiddleware"`);
   - todo `$ref` aponta para um schema que existe.

> Validar a estrutura interna do Express 5 (`router.stack`, `layer.route`) antes de
> escrever o script: a forma exata mudou entre o 4 e o 5. Se a introspecção ficar frágil,
> alternativa: exportar de cada `*Routes.ts` uma lista `{ method, path, auth }` e registrar
> as rotas a partir dela.

## 5. Plano de execução
Cada passo cabe em um commit.

1. [x] Criar a branch `feat/api-swagger` a partir de `main`; instalar as dependências;
       conferir compatibilidade de `swagger-ui-express` com Express 5.
2. [x] Esqueleto: `docs/openapi/index.ts` com `info`, `servers`, `tags`, `bearerAuth`;
       `swagger.ts`; montar no `app.ts`. `/docs` abre vazio.
3. [x] `schemas.ts` e `responses.ts` com todos os schemas da seção 4.5, importando os
       `enum` dos models.
4. [x] Paths de **Sistema, Auth e Usuário** (rotas 1–6).
5. [x] Paths de **Catálogo de éguas, Pistas e Skills** (rotas 7, 8, 14–16).
6. [x] Paths de **Égua do usuário, Treino e carreira, aprender skill** (rotas 9–13).
7. [x] Paths de **Corrida** (17–18), com o exemplo real de simulação gerado offline.
8. [x] `openapiCheck.ts` + script `docs:check`; rodar e zerar as diferenças.
9. [x] Validar a spec com um linter OpenAPI (ex.: `npx @redocly/cli lint`
       apontando para o `/openapi.json` salvo em arquivo) e corrigir avisos relevantes.
10. [x] Documentação: `docs/race-system-design.md` (4.7, 5, 6, 7), `README.md` (UTF-16!),
        `.env.example`, `docs/tasks/README.md`.
11. [x] Criar as tasks de correção levantadas na seção 9 (formato de erro, bug do
        `getHorse`, status do login, controllers sem rota).

## 6. Critérios de aceite
- [x] **Dado** o backend rodando, **quando** abro `http://localhost:3000/docs`, **então**
      vejo as 18 operações agrupadas em 9 tags, cada uma com summary e descrição em português.
- [x] **Dado** `GET /openapi.json`, **quando** passo pelo linter, **então** não há erros.
- [x] **Dado** uma rota protegida, **quando** olho no Swagger, **então** ela tem cadeado, e
      depois de colar o token do login em "Authorize" o "Try it out" envia o header certo.
- [x] **Dado** qualquer operação, **então** ela lista todos os códigos de status que o
      controller pode devolver (seção 4.4), com exemplo de corpo para cada um.
- [x] **Dado** `POST /race/run`, **então** o exemplo de 200 é uma simulação real, e
      `RaceSimulation`, `RunnerTelemetry` e `CareerOutcome` têm cada campo descrito com unidade.
- [x] **Dado** que eu acrescente uma rota nova sem documentar, **quando** rodo
      `npm run docs:check`, **então** ele falha e diz qual rota falta.
- [x] **Dado** `API_DOCS=false`, **quando** o backend sobe, **então** `/docs` e
      `/openapi.json` respondem 404.
- [x] **Dado** um valor novo em `RUNNING_STYLES` (ou outro enum), **então** a spec o mostra
      sem editar arquivo de documentação.
- [x] `docs/race-system-design.md` não cita mais `POST /races`, `requirements` de skill nem
      o fator `0.4`.

## 7. Como verificar

```bash
npm install --prefix backend
```

```bash
cd backend && npx tsc --noEmit
```

```bash
npm run docs:check --prefix backend
```

- **Manual:** subir o backend **apontando para um MongoDB local** (`MONGODB_URI`) e abrir
  `/docs`. Percorrer as 18 operações conferindo contra a seção 4.4. Sem `MONGODB_URI` o
  backend usa o Atlas de verdade (ver seção 9).
- **Automático:** `docs:check` e o linter OpenAPI.
- **Regressão a observar:** o `app.use("/docs", …)` vir antes de `app.use(routes)` não pode
  sombrear nenhuma rota (nenhuma começa com `/docs`); `race:check`, `training:check` e
  `career:check` continuam passando.

## 8. Impacto em documentação
- [x] `README.md` — seção "API" com o link para `/docs` e `API_DOCS`
- [x] `docs/race-system-design.md` — corrigir 4.7, 5, 6 e trocar a tabela da seção 7 por
      um link para o Swagger (mantendo uma lista curta das rotas)
- [x] `docs/guia-do-jogador.md` — seção "Para quem mexe no código": link para `/docs`
- [x] `docs/tasks/README.md` — linha 18 + status

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| **"Try it out" escreve no banco de verdade.** Sem `MONGODB_URI`, o backend conecta no Atlas de produção; treinar ou correr pelo Swagger altera saves reais. | alto | Seção 7 exige banco local. Colocar o aviso no `info.description` da spec. Avaliar `API_DOCS=false` por padrão em produção. Eduardo decide. |
| Spec e código se distanciam com o tempo | médio | `docs:check` cobre rotas; enums vêm dos models. Corpos de resposta continuam manuais: revisar a spec em toda task que mexe em controller (acrescentar item no `TEMPLATE.md`, seção 8). |
| `getHorse` não dá `return` depois do 404: chama `res.status(200)` em seguida, lança `ERR_HTTP_HEADERS_SENT`, cai no `catch`, que tenta responder 500 e lança de novo | baixo (o cliente recebe o 404) | Documentar como 404; abrir task de correção. |
| Formato de erro misto (`msg` × `error`) | baixo | Documentar os dois (`Error`, `ErrorLegacy`); task de padronização depois. |
| Login responde 422 para credencial errada | baixo | Documentar; decidir na task de padronização se vira 401. |
| `postHorses`, `patchHorse`, `update` e `remove` existem sem rota; `update` e `remove` não checam dono | baixo hoje, alto se alguém rotear | Não documentar (não são rotas). Task para remover ou proteger. |
| `README.md` está em **UTF-16**; editar como UTF-8 corrompe o arquivo | médio | Ler e gravar preservando a codificação. |
| Introspecção de `router.stack` depende de internals do Express 5 | médio | Alternativa da seção 4.7 (lista declarativa de rotas). |
| `swagger-ui-express` e Express 5 | baixo | Conferir no passo 1; alternativa: servir o `swagger-ui-dist` estático. |
| Gerar os tipos do frontend a partir da spec (`openapi-typescript`) eliminaria a duplicação de `frontend/src/types/race.ts` | — | Fora do escopo; sugerir como task futura. |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] Build passa: `npm run build --prefix frontend` e `npx tsc --noEmit` no backend
- [x] `npm run docs:check` passa
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Tasks de correção da seção 9 criadas
- [ ] Commit e push na branch própria; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Task criada. Inventário de rotas e respostas levantado a partir de `main` (15b36a5). |
| 2026-09-27 | Implementada. Spec em `backend/src/docs/openapi/` (18 operações, 9 tags), Swagger UI em `/docs`, JSON em `/openapi.json`, `npm run docs:check` (18 × 18). Redocly `lint` (recommended): 0 erros, 5 avisos aceitos — `/`, `/horse`, `/track` e `/skill` não têm resposta 4xx de verdade, e o servidor padrão é `localhost`. |
| 2026-09-27 | **Dependências só em `devDependencies`** (`swagger-ui-express`, `@types/swagger-ui-express`, `openapi-types`). `mountApiDocs` carrega o `swagger-ui-express` com `require` dentro de `try`: numa instalação `--omit=dev` as docs ficam desligadas com um aviso, sem derrubar o servidor. `openapi-types` só entra como tipo. |
| 2026-09-27 | `API_DOCS`: `true`/`false` forçam; sem a variável, as docs ficam ligadas **exceto com `NODE_ENV=production`** (resolve o risco do "Try it out" em produção da seção 9). Testado: `false` → 404 nas duas rotas; sem variável → 200; `production` → 404; `true` + `production` → 200. |
| 2026-09-27 | Desvios do plano: o `openapi-types` tem o `PathItemObject` 3.1 quebrado (mistura o tipo de operação do 3.0), então os arquivos de path usam um tipo local `Paths` e o `index.ts` faz um cast; campos anuláveis usam `anyOf` com `{ type: "null" }` (com `oneOf` o validador de exemplos do Redocly rejeitava `null`); rotas públicas declaram `security: []`. `User` (create/purchase, carreira crua em `StoredCareer`) e `UserProfile` (`GET /user/me`, carreira como `CareerView`) viraram schemas separados porque as respostas diferem. O 500 de `SECRET_KEY` ausente é um `components.examples.AuthMisconfigured` referenciado dentro do 500 de cada rota protegida (não dá para ter duas respostas 500). |
| 2026-09-27 | Exemplo de `POST /race/run`: simulação real gerada offline (Silence Suzuka 98/68/68/58, `front`, `steady-breathing`, `niigata-mile`, seed 20260927), recortada para 3 corredoras, 8 frames e 3 turnos de telemetria. Os demais exemplos leem os catálogos de `src/data`. |
| 2026-09-27 | Verificado no navegador com um express isolado que só monta `mountApiDocs` (sem banco): 18 operações em 9 tags, 10 cadeados, e depois do Authorize o "Try it out" manda `Authorization: Bearer …`. **Não** percorri as rotas contra um MongoDB local. `race:check`, `training:check` e `career:check` passam. Tasks de correção criadas: `20`, `21`, `22`. |

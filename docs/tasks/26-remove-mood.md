# Task 26 — Remover o sistema de humor

| Campo | Valor |
|---|---|
| **ID** | `26` |
| **Branch** | `feat/remove-mood` |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | M |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | fullstack |
| **Criada em** | 2026-09-29 |

---

## 1. Contexto
O jogo tem muita coisa para acompanhar: turnos, energia, skill points, carreira, rivais e
humor. O humor (1 a 5 estrelas) multiplicava o ganho do treino de ×0,85 a ×1,15. Subia ao
descansar, ao treinar bem e ao vencer, e caía ao falhar um treino ou correr mal. Na
prática, ele repetia o que a energia e o resultado da corrida já dizem, e ocupava espaço
na tela de carreira e na de escolha de pista. O Eduardo pediu para tirar.

## 2. Objetivo
A égua não tem mais humor: o treino, o descanso e a corrida deixam de ler ou mudar esse
valor, e ele some da API, das telas e da documentação. A dificuldade das carreiras continua
a mesma.

## 3. Escopo

### Dentro do escopo
- [x] Motor de treino sem o multiplicador de humor e sem `moodChange`; `resolveRest` só
      devolve energia.
- [x] Ganho base do treino ×1,12 (9 / 9 / 8 / 7 → 10,08 / 10,08 / 8,96 / 7,84), para as
      carreiras não ficarem mais difíceis (seção 4).
- [x] Corrida sem +1 na vitória e −1 na metade de baixo.
- [x] Campo `mood` e `MAX_MOOD` fora do modelo `User`.
- [x] Saves antigos: o `mood` gravado é apagado na primeira leitura (`normalizeOwnedHorse`)
      e nunca sai nas respostas (`plainOwnedHorse`), nem no `GET /user/me`, que não normaliza.
- [x] Spec OpenAPI: `OwnedHorse.mood`, `TrainingOutcome.moodChange` e `RestOutcome.mood`
      removidos; textos e exemplos sem humor; fórmula com as bases novas.
- [x] Frontend: cartão "Humor" da carreira, linha "Humor" da escolha de pista, tipos e o
      texto do guia no app.
- [x] `trainingEngineCheck` e `careerCheck` sem humor.
- [x] Guia do jogador, `race-system-design.md` e `README.md`.

### Fora do escopo
- **O PDF `docs/UmaSprint-Mecanicas-do-Jogo.pdf`** ainda fala de humor (20 menções). Não há
  fonte do PDF no repositório para gerá-lo de novo; fica para quando ele for refeito.
- As tasks antigas (`02`, `05`, `08`, `15`, `18`) continuam citando humor: são histórico do
  que foi feito na época.

## 4. Abordagem técnica

**Balanceamento.** Com humor, o jogador simulado do `career:check` (acerta de 6 a 10 no
minigame) passava a maior parte do tempo com 4 ou 5 estrelas, ou seja ×1,07 a ×1,15 no
ganho. Tirar o humor sem compensar derrubou a carreira completa de 4–12% para 0–2%. Um
fator único no ganho base foi testado contra o `career:check` (determinístico):

| Égua | Com humor | Sem humor | ×1,08 | **×1,12** | ×1,15 |
|---|---|---|---|---|---|
| Nice Nature | 7% | 2% | 5% | **6%** | 9% |
| Silence Suzuka | 12% | 1% | 6% | **14%** | 14% |
| Special Week | 7% | 0% | 1% | **6%** | 10% |
| Oguri Cap | 4% | 0% | 2% | **2%** | 5% |
| Grass Wonder | 9% | 1% | 4% | **7%** | 9% |

O Eduardo escolheu manter a dificuldade: ×1,12 foi o mais perto do que era. Ficou embutido
nas bases de `BASE_GAIN`, com o motivo num comentário.

**Saves antigos.** O Mongoose guarda campos fora do schema que vieram do banco e os devolve
em `toObject()` (conferido sem banco, com `User.hydrate`). Por isso:
- `normalizeOwnedHorse` faz `set("mood", undefined, { strict: false })`, que vira
  `$unset: { "horses.N.mood": 1 }` no próximo `save`;
- `plainOwnedHorse` tira `mood` do objeto antes de responder, para as leituras que não
  passam pela normalização (o perfil).

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/services/trainingEngine.ts` | editar | Sem humor; bases ×1,12 |
| `backend/src/models/user.ts` | editar | Sem `mood` e `MAX_MOOD` |
| `backend/src/controllers/userController.ts` | editar | Treino e descanso sem humor; perfil via `plainOwnedHorse` |
| `backend/src/controllers/raceController.ts` | editar | Corrida não mexe no humor |
| `backend/src/services/ownedHorse.ts` | editar | Apaga o `mood` legado; `plainOwnedHorse` |
| `backend/src/docs/openapi/*` | editar | Schemas, textos e exemplos |
| `backend/src/scripts/trainingEngineCheck.ts`, `careerCheck.ts` | editar | Sem humor |
| `frontend/src/components/CareerMenu/*`, `RaceTrackSelect.tsx`, `GuideContent.tsx` | editar | Sem humor na tela |
| `frontend/src/services/User.ts`, `frontend/src/types/horse.ts` | editar | Tipos sem `mood`/`moodChange` |
| `docs/guia-do-jogador.md`, `docs/race-system-design.md`, `README.md` | editar | Sem humor; bases novas |

**Contratos.** Respostas da API que perdem campos: `OwnedHorse.mood`,
`TrainingOutcome.moodChange` e `RestOutcome.mood`. O frontend não lê mais nenhum deles.

## 5. Plano de execução
1. [x] Medir o `career:check` com humor (linha de base).
2. [x] Tirar o humor do backend, dos scripts e da spec.
3. [x] Medir de novo e escolher a compensação com o Eduardo.
4. [x] Tirar o humor do frontend.
5. [x] Documentação.

## 6. Critérios de aceite
- [x] **Dado** um treino, **quando** ele termina, **então** a resposta não tem `moodChange` e
      o ganho não depende de humor.
- [x] **Dado** um descanso, **quando** ele termina, **então** só a energia muda.
- [x] **Dado** uma vitória ou uma derrota, **quando** a corrida termina, **então** nada de
      humor muda.
- [x] **Dado** um save antigo com `mood`, **quando** a égua é lida, **então** o campo é
      apagado e não aparece em nenhuma resposta.
- [x] **Dado** o `career:check`, **quando** roda, **então** a carreira completa fica perto do
      que era com humor.
- [x] **Dado** a tela de carreira e a de escolha de pista, **quando** abrem, **então** não há
      humor.

## 7. Como verificar

```bash
npm run training:check --prefix backend
npm run career:check --prefix backend
npm run docs:check --prefix backend
npm run build --prefix frontend
```

Nunca contra o backend local, que usa o banco real.

## 8. Impacto em documentação
- [x] `README.md` (UTF-16, editado mantendo a codificação)
- [x] `docs/race-system-design.md`
- [x] `docs/guia-do-jogador.md` (também a taxa de carreiras completas da simulação, que
      estava desatualizada: agora de 2% a 14%)
- [x] Spec da API em `backend/src/docs/openapi/` + `npm run docs:check`
- [x] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Quem jogava de humor baixo agora treina mais que antes (×1,12 contra ×0,85–1,0) | baixo | O jogador simulado ficava quase sempre com humor alto, e é a referência do balanceamento |
| O PDF de mecânicas fica desatualizado | baixo | Refazer o PDF quando houver a fonte dele |
| Um cliente antigo em cache ainda lê `mood` | baixo | Ele tratava a falta como 3 estrelas; nada quebra |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] Build passa: `npm run build --prefix frontend` e `npx tsc --noEmit` no backend
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Push da branch e merge na `main`; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-29 | Task criada e implementada. `training:check`, `race:check` e `docs:check` passam; `career:check` com ×1,12 dá 6 / 14 / 6 / 2 / 7% de carreiras completas (antes, com humor, 7 / 12 / 7 / 4 / 9%). `npm run lint` só acusa o erro antigo de `TrackCard.tsx`. |

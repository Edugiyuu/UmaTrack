# Task 17 — Carreira por égua

| Campo | Valor |
|---|---|
| **ID** | `17` |
| **Branch** | `feat/horse-career` |
| **Base** | `feat/skills-points-only` |
| **Status** | ✅ Concluída (merge em `main` em 2026-09-27) |
| **Tamanho** | G |
| **Depende de** | `15` (tela de treino v2) |
| **Bloqueia** | — |
| **Área** | fullstack |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
Até aqui o loop era uma "temporada" genérica: 5 turnos de treino, qualquer pista a
qualquer hora, e cada corrida devolvia os 5 turnos. Nada dava rumo ao treino, e a tela
de treino v2 do Figma já anunciava "próxima corrida em N turnos" sem o jogo ter isso.

O Eduardo pediu uma carreira por égua, como no Uma Musume: cada uma tem as suas provas, e
quando os turnos chegam a 0 ela corre a prova marcada. Decisões dele (2026-09-27):

- **Provas avulsas** continuam permitidas entre as provas da carreira.
- Cada prova da carreira tem uma **meta** de colocação; não bater **encerra** a carreira.
- Carreira encerrada (completa ou não) **aposenta** a égua, que fica guardada no perfil;
  dá para começar **nova carreira** com a mesma égua, que volta aos atributos iniciais, e
  o jogador passa a ter as duas.
- Os calendários são propostos aqui e ajustados por ele.

## 2. Objetivo
Cada égua segue o seu calendário de provas, com meta, aposentadoria e recomeço.

## 3. Escopo

### Dentro do escopo
- [x] Calendário por égua em `backend/src/data/careers.ts` (e um padrão para éguas sem calendário).
- [x] Modelo: `career` no `OwnedHorse` (status, prova atual, resultados, data de fim).
- [x] `turnsLeft` passa a contar até a próxima prova da carreira; sai a temporada de 5 turnos.
- [x] Turno 0: só a prova da carreira pode ser corrida, sem inscrição; treino bloqueado;
      descanso de graça (como já era).
- [x] Prova avulsa (turnos > 0): qualquer pista, gasta 1 turno, cobra inscrição.
- [x] Meta batida → próxima prova e seus turnos; não batida → carreira encerrada; última
      prova → carreira completa.
- [x] Aposentada: não treina, não descansa, não corre, não aprende skill.
- [x] `POST /user/me/horses/:horseId/new-career`: nova cópia com os atributos do catálogo,
      de graça, só quando não há carreira em andamento.
- [x] Tela de treino: card da próxima prova, calendário, botão da prova da carreira ou
      de prova avulsa, tela de aposentada com **Nova carreira**.
- [x] Seleção de pista: só a pista da carreira no turno 0; aviso de prova avulsa antes.
- [x] Resultado: o que a prova fez com a carreira.
- [x] Perfil: **Carreiras encerradas**.
- [x] `npm run career:check`: regras da carreira + simulação de balanceamento.
- [x] Guia do jogador e design do sistema.

### Fora do escopo
- Mudar a economia de treino. Os calendários foram ajustados aos ganhos atuais (seção 4).
- Recompensa especial por completar a carreira (título, bônus): fica para outra task se
  fizer falta.
- Migração de banco: éguas antigas ganham a carreira na primeira leitura (seção 4).

## 4. Abordagem técnica

**Identidade das cópias.** As rotas do frontend usam o id do catálogo. Com aposentadas e
recomeços, uma égua pode ter várias cópias; `findOwnedHorse` resolve para a cópia **em
carreira**, ou para a última aposentada quando não há nenhuma. A compra continua
bloqueando quem já tem a égua (recomeçar é pela nova carreira).

**Éguas antigas.** `normalizeOwnedHorse` cria `career` na primeira leitura, começando na
primeira prova do calendário com os turnos que ela já tinha.

**Balanceamento.** `src/scripts/careerCheck.ts` joga cada carreira 200 vezes com um
jogador simples (descansa abaixo de 40 de energia, treina o atributo mais longe do
requisito da próxima pista com minigame de 6 a 10, compra as passivas de +25, não corre
avulsas), usando `resolveTraining`, `generateRivals` e `simulateRace` de verdade.
A primeira versão (4 provas, 6–12 turnos) ficou impossível: com ~3,5 pontos de atributo
por turno, Kyoto pede ~22 turnos de preparo depois de Hakodate. Os calendários finais têm
5 provas e 50–60 turnos, com uma prova intermediária para não haver um buraco longo:

| Égua | Completa | Última prova (bate a meta) |
|---|---|---|
| Silence Suzuka | 52% | Kyoto top 3: 60% |
| Special Week | 16% | Tokyo top 3: 26% |
| Oguri Cap | 13% | Kokura top 5: 26% |
| Grass Wonder | 21% | Tokyo top 5: 36% |
| Nice Nature | 20% | Tokyo top 5: 37% |

As primeiras provas passam em 82–100%. Um jogador de verdade corre avulsas (SP para
skills) e escolhe o treino melhor, então deve ir além desses números.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/data/careers.ts` | criar | Calendários |
| `backend/src/services/career.ts` | criar | Regras: prova devida, resultado, aposentadoria, cópia nova, view |
| `backend/src/models/user.ts` | editar | `career` no `OwnedHorse` |
| `backend/src/services/ownedHorse.ts` | editar | Normaliza `career`; resolve a cópia em carreira; serializa a carreira |
| `backend/src/controllers/raceController.ts` | editar | Prova da carreira, avulsa, inscrição, sem temporada |
| `backend/src/controllers/userController.ts` | editar | Compra/cadastro com `freshOwnedHorse`; bloqueios; nova carreira; `/user/me` com a carreira |
| `backend/src/controllers/skillController.ts` | editar | Bloqueia aposentada |
| `backend/src/routes/userRoutes.ts` | editar | Rota de nova carreira |
| `backend/src/scripts/careerCheck.ts` | criar | Regras + simulação |
| `frontend/src/types/horse.ts`, `types/race.ts` | editar | `CareerView`, `rewards.career` |
| `frontend/src/services/User.ts` | editar | `startNewCareer` |
| `frontend/src/constants/career.ts` | criar | `goalLabel` |
| `frontend/src/components/CareerMenu/` | editar | Card, calendário (`CareerCalendar`), ações, aposentada |
| `frontend/src/components/RaceTrackSelect/` | editar | Prova da carreira / avulsa |
| `frontend/src/components/RaceRunner/RaceResults.*` | editar | Resultado da carreira |
| `frontend/src/components/RetiredHorses/` | criar | Carreiras encerradas no perfil |

**Contratos**

```ts
// GET /user/me/horses/:horseId (e cada égua de GET /user/me)
career: {
  status: "active" | "completed" | "failed";
  raceIndex: number;
  races: { index; trackSlug; trackName; turnsBefore; goal }[];
  results: { raceIndex; trackSlug; trackName; goal; placement; fieldSize; passed; ranAt }[];
  endedAt: string | null;
  nextRace: CareerRace | null;
  raceDue: boolean; // turnos acabaram: só a prova da carreira
}

// POST /race/run → rewards.career
| { kind: "passed"; goal; placement; next: CareerRace }
| { kind: "completed" | "failed"; goal; placement }
| null // prova avulsa
```

## 5. Critérios de aceite
- [x] **Dado** uma égua nova, **quando** a tela de treino abre, **então** mostra a próxima
      prova, em quantos turnos e a meta, e o calendário inteiro.
- [x] **Dado** turnos > 0, **quando** ela corre uma avulsa, **então** gasta 1 turno, cobra
      a inscrição e a carreira não muda.
- [x] **Dado** turnos = 0, **quando** o jogador abre as pistas, **então** só a pista da
      carreira aparece, sem inscrição; qualquer outra é recusada pelo servidor.
- [x] **Dado** a meta batida, **quando** o resultado aparece, **então** diz a próxima prova
      e os turnos voltam para os dela.
- [x] **Dado** a meta não batida, **quando** o resultado aparece, **então** diz que a
      carreira terminou; a égua não treina nem corre mais.
- [x] **Dado** uma égua aposentada, **quando** o jogador clica **Nova carreira**, **então**
      ela recomeça com os atributos do catálogo e a aposentada aparece no perfil.

## 6. Como verificar

```bash
npm run career:check --prefix backend
```

- Regras: 11 checagens no começo do `career:check` (`CAREER_RULES_ONLY=1` roda só elas).
- Tela: mock da API em memória (fora do repositório) servindo as regras reais de
  `services/career.ts`, com capturas no Edge headless. Nunca contra o backend local, que
  usa o banco real.
- Regressão: `npm run race:check` e `npm run training:check` passam.

## 7. Impacto em documentação
- [x] `docs/guia-do-jogador.md` — seção 3 vira "A carreira", prêmios, roteiro e erros comuns
- [x] `docs/race-system-design.md` — turnos e rotas
- [x] `docs/tasks/README.md`

## 8. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Carreiras longas (50–60 turnos, cada treino é um minigame) cansam | médio | Encurtar exige mexer nos ganhos de treino; o Eduardo decide |
| Metas duras demais ou fáceis demais | médio | Tudo em `data/careers.ts`; `career:check` mede o efeito |
| Éguas antigas começam a carreira do zero de calendário | baixo | Mantêm atributos e turnos; só ganham o calendário |
| Sem recompensa por completar | baixo | Task própria se fizer falta |

## 9. Definition of Done
- [x] Critérios de aceite marcados
- [x] `npx tsc --noEmit` no backend e `npm run build --prefix frontend` passam; `eslint` limpo
- [x] Documentação da seção 7 atualizada
- [x] Commit e push em `feat/horse-career`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Pedido do Eduardo, com as quatro decisões da seção 1. Implementada e verificada no mock. |
| 2026-09-27 | Revisão do Eduardo: a tela de treino rolava para mostrar as ações. No desktop ela agora cabe na janela (altura da tela, espaçamentos em `vh`, grid de atributos ocupando a sobra; só a lista de skills rola, dentro da coluna). Conferido com as fontes reais em 1400×912, 1366×768 e 1280×720, sem texto cortado no calendário. |

**Verificação no mock** (Silence Suzuka): carreira nova mostra "Próxima prova: Sapporo Sprint
em 6 turnos · meta top 3"; no turno 0 o treino fica bloqueado, o card vira "Hoje é dia de
corrida" e as pistas mostram só Sapporo, sem inscrição; vencendo, o resultado diz "Meta
batida! Próxima prova: Niigata Mile em 8 turnos" e os turnos vão a 8; uma avulsa em Kyoto
gasta 1 turno (8 → 7) e cobra 350; no turno 0 Tokyo é recusada; terminando em 10º com meta
top 3 a carreira encerra; aposentada não treina; **Nova carreira** volta a Speed 84 e a
Sapporo em 6 turnos; o perfil lista a aposentada com Sapporo 1º ✓ e Niigata 10º ✗.

# Task 19 — Rivais montadas sobre a égua do jogador

| Campo | Valor |
|---|---|
| **ID** | `19` |
| **Branch** | `docs/mechanics-pdf-v2` (feita junto com o PDF de mecânicas, a pedido) |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | M |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | fullstack |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
O pelotão inteiro era gerado em torno dos `requirements` da pista. Com uns 30% acima do
gabarito a égua vencia 100% das corridas: uma égua com 130 de Stamina corria contra
adversárias de 60 a 90. O Eduardo quis que o desafio acompanhasse a égua do jogador.

## 2. Objetivo
Toda corrida tem 3 rivais do nível da égua do jogador, apresentadas antes da largada.

## 3. Escopo

### Dentro do escopo
- [x] 3 rivais (`RIVAL_COUNT`) com cada atributo = jogador × U(0,9; 1,3), sorteado por
      atributo; nunca abaixo do que o pelotão comum daria.
- [x] O resto do pelotão continua igual (mesmo rng de antes, fluxo separado para as rivais).
- [x] `isRival` em `runners[]` e `rivals[]` na simulação.
- [x] Tela **Suas rivais** antes da largada, com o botão **Largar!**; etiqueta RIVAL na
      classificação.
- [x] Guia, design doc, PDF de mecânicas e comentário dos calendários atualizados.

### Fora do escopo
- Reajustar as metas dos calendários: mantidas de propósito (ver seção 4).
- Arte própria para as rivais.

## 4. Abordagem técnica

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/services/rivalGenerator.ts` | editar | Opção `player`; as 3 primeiras viram rivais |
| `backend/src/services/raceEngine.ts` | editar | `isRival` em `runners[]`; `rivals[]` |
| `backend/src/types/race.ts` e `frontend/src/types/race.ts` | editar | `RivalProfile`, `isRival`, `rivals` |
| `backend/src/controllers/raceController.ts` | editar | Passa os atributos da égua |
| `backend/src/scripts/careerCheck.ts` | editar | Idem, para simular o jogo real |
| `frontend/src/components/RaceRunner/RaceRivals.tsx` + `.css` | criar | A janela de apresentação |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Segura o replay até **Largar!** |
| `frontend/src/components/RaceRunner/RaceStandings.tsx` | editar | Etiqueta RIVAL |

**Balanceamento.** Foram testadas quatro variantes (400 corridas por cenário, offline). A
escolhida, com média de 1,1× os atributos do jogador e três rivais, deixa a vitória
difícil em qualquer nível de treino. `career:check` com a política simples de treino:

| Égua | Carreira completa antes | Depois |
|---|---|---|
| Silence Suzuka | 54% | 0% |
| Nice Nature | 21% | 1% |
| Grass Wonder | 20% | 1% |
| Special Week | 16% | 1% |
| Oguri Cap | 7% | 1% |

O Eduardo optou por manter assim: "é mais difícil, mas dá pra ganhar". Se ficar difícil
demais no jogo, as alavancas são `RIVAL_MIN`/`RIVAL_MAX`/`RIVAL_COUNT` em
`rivalGenerator.ts` ou as metas em `data/careers.ts`.

## 5. Critérios de aceite
- [x] **Dado** uma corrida, **então** 3 corredoras têm cada atributo entre 90% e 130% do
      da égua do jogador (ou o valor do pelotão comum, se maior).
- [x] **Dado** o replay carregado, **quando** a tela abre, **então** a janela **Suas rivais**
      aparece e a corrida só anda depois de **Largar!**.
- [x] **Dado** uma corrida antiga sem `rivals`, **então** ela começa direto.
- [x] `race:check` passa.

## 6. Como verificar
- `npx tsc --noEmit` no backend, `npm run build --prefix frontend`, `eslint` em `RaceRunner/`.
- `npm run race:check` e `npm run career:check --prefix backend`.
- A janela foi renderizada isolada no dev server com dados de exemplo; nenhuma corrida
  real foi rodada (o backend local usa o banco de verdade).

## 7. Definition of Done
- [x] Critérios de aceite marcados
- [x] Build e typecheck passam
- [x] Documentação atualizada
- [x] Commit na branch; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Implementada e balanceamento medido; metas mantidas por decisão do Eduardo. |

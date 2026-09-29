# Tasks — UmaSprint

Cada task roda numa branch criada a partir de `main`. Tasks parecidas podem dividir a mesma
branch (ver [Convenções](#convenções)) para não acumular uma branch por task.
O design do sistema de corridas está em [`docs/race-system-design.md`](../race-system-design.md).

## Como criar uma task

1. Copie [`TEMPLATE.md`](TEMPLATE.md) para `docs/tasks/NN-slug.md` e preencha.
2. Crie a branch a partir de `main` seguindo a convenção abaixo — ou continue na branch de
   uma task relacionada que ainda não foi mergeada.
3. Adicione a linha na tabela de [status](#status).
4. Ao terminar, feche o **Definition of Done** do próprio arquivo e atualize o status aqui.

### Convenções

- **Nome do arquivo:** `NN-slug-curto.md`, `NN` em dois dígitos e sequencial.
- **Branch:** `feat/…` (funcionalidade), `fix/…` (correção), `docs/…` (documentação),
  `refactor/…` (sem mudança de comportamento).
- **Tamanho:** `P` cabe em uma sessão, `M` em uma ou duas, `G` deve ser quebrada em
  subtasks antes de começar.
- **Reuso de branch:** tasks relacionadas (mesma área, mesmos arquivos, mesmo tipo de
  mudança) continuam na mesma branch. Ex.: "mudar visual dos GIFs" abre `feat/visual-polish`;
  "mudar visual das skills" continua nela. Abra uma branch nova quando a task for de outra
  área, precisar ser mergeada sozinha, ou a branch anterior já tiver ido para a `main`.
  Na tabela de status, repita o nome da branch compartilhada nas duas linhas.
- **Idioma:** documentação em português; código, nomes de arquivo e branches em inglês.

### Legenda de status

| Ícone | Significado |
|---|---|
| 🔲 | Não iniciada |
| 🚧 | Em andamento |
| 🔍 | Em revisão |
| ✅ | Concluída |
| ⏸️ | Pausada |

## Status

| # | Task | Branch | Tamanho | Status |
|---|---|---|---|---|
| 00 | Plano e documentação | `docs/race-system-plan` | M | ✅ |
| 01 | [Modelo + catálogo de pistas](01-track-system.md) | `feat/track-system` | M | ✅ |
| 02 | [Catálogo de skills + skill points](02-skill-system.md) | `feat/skill-system` | M | ✅ |
| 03 | [Motor de simulação de corrida](03-race-engine.md) | `feat/race-engine` | G | ✅ |
| 04 | [API de corrida + prêmios + histórico](04-race-api.md) | `feat/race-api` | M | ✅ |
| 05 | [Treino dinâmico (ganhos variáveis, energia, SP)](05-dynamic-training.md) | `feat/dynamic-training` | M | ✅ |
| 06 | [UI: seleção de pista](06-race-ui-track-select.md) | `feat/race-ui-track-select` | M | ✅ |
| 07 | [UI: corrida animada + resultados](07-race-ui-runner.md) | `feat/race-ui-runner` | G | ✅ |
| 08 | [UI: painel de skills no career](08-skill-ui.md) | `feat/skill-ui` | M | ✅ |
| 09 | [Integração final do loop de jogo](09-race-loop-integration.md) | `feat/race-loop-integration` | M | ✅ |
| 10 | [Documentação e template de tasks](10-task-template.md) | `docs/task-template` | P | 🚧 |
| 11 | [Refazer o frontend da tela de corrida](11-race-ui-redesign.md) | `feat/race-ui-redesign` | G | ✅ |
| 12 | [Telemetria da corrida no motor](12-race-telemetry-engine.md) | `feat/race-telemetry-engine` | P | ✅ |
| 13 | [HUD de desempenho durante a corrida](13-race-telemetry-hud.md) | `feat/race-telemetry-hud` | M | ✅ |
| 14 | [Motor de corrida por turnos](14-race-turn-engine.md) | `feat/race-turn-engine` | G | ✅ |
| 15 | [Telas v2 de treino e de corrida (Figma)](15-ui-v2-train-race.md) | `feat/ui-v2-train-race` | M | ✅ |
| 16 | [Skills custam só skill points](16-skills-points-only.md) | `feat/skills-points-only` | P | ✅ |
| 17 | [Carreira por égua](17-horse-career.md) | `feat/horse-career` | G | ✅ |
| 18 | [Documentar a API com Swagger (OpenAPI 3.1)](18-api-swagger.md) | `feat/api-swagger` | M | 🔍 |
| 19 | [Rivais montadas sobre a égua do jogador](19-player-rivals.md) | `docs/mechanics-pdf-v2` | M | ✅ |
| 20 | [Padronizar as respostas de erro da API](20-api-error-format.md) | `fix/api-errors` | P | 🔲 |
| 21 | [Corrigir o 404 de `GET /horse/:id`](21-get-horse-404.md) | `fix/api-errors` | P | 🔲 |
| 22 | [Remover os controllers sem rota](22-unrouted-controllers.md) | `fix/api-errors` | P | 🔲 |
| 23 | [Efeitos visuais da corrida (skills, largada, reta final, HUD vivo)](23-race-skill-fx.md) | `feat/race-visual-effects` | G | 🔍 |
| 24 | [Música e som do jogo (trilha por tela, corrida e efeitos sonoros)](24-game-audio.md) | `feat/race-visual-effects` | G | 🔲 |
| 25 | [Passivas únicas de cada égua](25-horse-passives.md) | `feat/horse-passives` | M | 🔲 |
| 26 | [Remover o sistema de humor](26-remove-mood.md) | `feat/remove-mood` | M | ✅ |

### Ordem sugerida para 11–14

A `14` trocou o motor por ticks por um motor por turnos, e as tasks `12` e `13` foram
reescritas em cima dele. A `12` sai da `14`. A `11` foi feita sobre o motor antigo e já
recebeu o motor por turnos (merge de `main`). A `13` precisa das duas, dos
dados que a `12` expõe e do layout que a `11` prepara, por isso sai de
`feat/race-ui-redesign`.

```
14 (motor por turnos) ──> 12 (telemetria) ──┐
          │                                 ├──> 13 (HUD)
          └──> 11 (UI, retomar com o motor) ┘
```

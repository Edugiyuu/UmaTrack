# UmaSprint — Race System Design

Este documento descreve o design completo do sistema de corridas, pistas e skills
do UmaSprint. Ele é a referência para as tasks em [`docs/tasks/`](./tasks).

Procurando como **jogar** em vez de como o sistema é construído? Veja o
[Guia do Jogador](./guia-do-jogador.md).

## 1. Visão geral

O loop de jogo passa a ser:

```
Comprar Uma  ->  Treinar (turnos + energia + skill points)  ->  Aprender skills
             ->  Escolher pista  ->  Correr  ->  Prêmios (dinheiro + fãs + SP)
             ->  Treinar de novo
```

O treino deixa de dar um ganho fixo e passa a ser **dinâmico**: o ganho depende do
desempenho no minigame, do tipo de treino, da afinidade da Uma, da energia
restante e de retornos decrescentes conforme o atributo cresce.

## 2. Atributos

| Atributo | Efeito na corrida |
|---|---|
| **Speed** | O teto: velocidade máxima, em metros por turno. |
| **Stamina** | Tamanho do "tanque" de fôlego; se zerar, ela fica cansada até o fim. |
| **Power** | A arrancada: velocidade de largada e quanto ela acelera por turno até o teto. |
| **Wit** | Reduz o gasto de fôlego e aumenta a chance de ativar skills. |

## 3. Pistas (tracks)

Cada pista é um documento próprio com:

- `distance` (m) e `category`: `sprint` (<= 1400), `mile` (<= 1800), `medium` (<= 2400), `long` (> 2400)
- `surface`: `turf` | `dirt`
- `terrain`: `flat` | `incline` | `rolling` | `technical`
- `segments[]`: a pista é dividida em trechos, cada um com `grade` (inclinação em %),
  `curve` (0–1) e `lengthRatio`. A soma dos `lengthRatio` é 1.
- `statWeights`: quanto cada atributo pesa no desempenho naquela pista.
- `requirements`: mínimos **recomendados** por atributo. Ficar abaixo não bloqueia a
  inscrição; quem está exatamente neles chega no limite do fôlego (ver 4.3).
- `entryFee`, `prizeMoney[]` (por colocação), `fans`, `skillPointReward`.

> **Motor por turnos (task 14):** por enquanto o motor só usa `distance`, os
> `segments` (`lengthRatio` e `curve`, para saber onde há curva) e os `requirements`
> (só como aviso). `grade`, `surface` e `statWeights` continuam nos dados, mas ficam
> sem efeito até a conversa sobre pistas. O exemplo abaixo descreve o design original.

### Exemplo: pista íngreme

A pista de Nakayama/Kokura tem `terrain: "incline"` e segmentos com `grade` até `+6%`.
Nesses segmentos o custo de fôlego sobe e a velocidade é multiplicada por um fator que
depende de **Power**: uma Uma com Power baixo perde muito mais velocidade na subida
do que uma com Power alto. Por isso a pista declara `requirements.power` alto.

## 4. Motor de corrida

Simulação determinística por *seed*, **por turnos**, rodando **no backend** (o cliente
só anima o replay devolvido, para não ser possível forjar resultados). Código em
`backend/src/services/raceEngine.ts`; a análise que levou a estas regras está na
[task 14](./tasks/14-race-turn-engine.md).

Unidades: distância em metros, velocidade em **metros por turno**, tempo em **turnos**.
Os atributos entram como estão: Speed 120 é um teto de 120 m/turno.

### 4.1 Velocidade
```
turno 1:          v = Power / 2
demais turnos:    v = min(Speed, v + Power / 6)
entrar em curva:  v = v / 1,2          (trecho com curve >= 0,4)
avanço:           distância += v       (a sobra passa para o trecho seguinte)
```
As skills de velocidade somam metros por turno em cima de `v` enquanto estão ativas, e as
de aceleração multiplicam o ganho do turno (no turno 1, a própria largada). O
avanço de cada turno varia até ±2% (ruído com seed), então duas corredoras idênticas
não andam grudadas.

### 4.2 Fases e pressão
- **Pressão** (gasto de fôlego): ×1,0 no primeiro terço, ×1,25 no segundo, ×1,5 no último.
- **Fases** (gatilho de skills): `opening` (0–16%), `middle` (16–66%), `final` (66–80%)
  e `spurt` (80–100%).

### 4.3 Fôlego
```
fôlego inicial = Stamina
custo/turno    = v² / 1800 × pressão × (1 − min(0,6; Wit / 500 + staminaSave))
fôlego <= 0    → cansada até o fim: Power / 3 e teto = Speed / 2
```
O custo é proporcional a v², então o custo **por metro** sobe com a velocidade: correr
mais rápido gasta mais, e um trecho mais longo também. O divisor 1800 foi calibrado para
que uma corredora exatamente nos `requirements` de cada pista chegue no limite do fôlego,
inclusive em Tokyo (2400m).

### 4.4 Estratégias (running style)
`front`, `pace`, `late` e `end` continuam no cadastro e na tela, mas **não têm efeito**
no motor por turnos. Voltam numa task própria.

### 4.5 Skills
Checadas uma vez por turno. Cada skill tem gatilho (fase, terreno, fôlego restante,
posição) e chance por turno de `baseChance + Wit × 0,002`. O efeito dura `duration`
turnos. Skills `flatStat` são passivas e somam no atributo antes da largada.
`inclineBoost` fica sem efeito enquanto o motor ignorar a inclinação.

### 4.6 Resultado
O motor devolve: classificação, tempo em turnos (com fração, que desempata quem termina
no mesmo turno), velocidade máxima, fôlego restante, `frames` do replay (4 amostras por
turno), log de skills ativadas e os avisos de atributo abaixo do recomendado.

### 4.7 Telemetria
Além do replay, o motor devolve `telemetry`: **um item por turno**, só da corredora do
jogador (vazio sem jogador). Cada item traz o que o motor decidiu naquele turno: fase,
pressão, colocação, velocidade base e corrida, teto, aceleração (negativa quando o cansaço
corta o teto), velocidade perdida ao entrar numa curva, fôlego gasto, desconto do Wit e das
skills, fôlego restante, metros que faltam, efeitos de skill ativos e se ela está cansada.
Tipos em `RunnerTelemetry` (`backend/src/types/race.ts`, espelhado no frontend).

A telemetria é só leitura: é coletada dos valores já calculados, sem sorteio, e o
`race:check` prova que a mesma corrida com e sem ela é idêntica. Ela vai na resposta de
`POST /race/run` e não é gravada no histórico.

**Alcance de fôlego e veredito de ritmo.** Com o fôlego do início do turno, o motor
projeta quantos metros ela ainda aguenta mantendo a velocidade atual (ou o teto, enquanto
ainda acelera), pagando cada terço restante com a pressão dele:
```
custo por metro = v / 1800 × pressão do terço × (1 − desconto)
alcance         = metros até o fôlego acabar, terço a terço
```
| Condição | `pace` | Leitura |
|---|---|---|
| `alcance >= restante × 1,15` | `safe` | Sobra fôlego |
| `alcance >= restante × 0,95` | `tight` | No limite, do jeito que tem que ser |
| caso contrário, ou cansada | `rushed` | Vai secar antes da linha |

Com isso, quem está exatamente nos `requirements` lê `tight` e quem vai secar lê `rushed`
vários turnos antes de ficar cansada. As curvas baixam a velocidade e o gasto, então a
projeção erra para o lado conservador.

O jogador vê essa telemetria no HUD da corrida (`frontend/src/components/RaceRunner/RaceHud.tsx`,
[task 13](./tasks/13-race-telemetry-hud.md)); a leitura de cada cartão está no
[guia do jogador](./guia-do-jogador.md#lendo-o-hud-da-corrida).

### 4.8 Pelotão e rivais
`backend/src/services/rivalGenerator.ts` monta `fieldSize − 1` adversárias:

- **O pelotão comum** sai dos `requirements` da pista, escalado pela `difficulty`
  (`0,86 + d × 0,028`), com um `spread` de 0,82–1,18 por corredora e um atributo de foco.
  Não escala com o jogador.
- **As 3 primeiras são rivais** (`RIVAL_COUNT`, [task 19](./tasks/19-player-rivals.md)):
  cada atributo é `max(valor do pelotão comum, round(atributo do jogador × U(0,9; 1,3)))`,
  com sorteio independente por atributo e fluxo de rng próprio (`seed ^ 0x5bd1e995`), para
  o pelotão comum sair igual ao que sairia sem rivais.

A simulação marca cada corredora com `isRival` em `runners[]` e devolve `rivals[]`
(atributos treinados, sem skills passivas, e nomes das skills), que o frontend mostra
antes da largada (`RaceRivals.tsx`).

## 5. Skills e skill points

- Treinar gera **skill points (SP)** além dos pontos de atributo.
- Skills ficam num catálogo com `cost` em SP, gatilho e efeito. O preço é só em SP: não há
  atributo mínimo (os `requirements` de skill saíram na task 16).
- Skills aprendidas ficam gravadas na Uma do usuário e são passadas ao motor de corrida.

Tipos de efeito: `speedBoost`, `accelBoost`, `staminaRecover`, `staminaSave`,
`startDash`, `inclineBoost`, `cornerBoost`, `flatStat`.

## 6. Treino dinâmico

```
ganho = round(base[trainType] * scoreRatio * affinity * energyMult * diminishing)
SP    = max(1, round(ganho * 0.45)) + 8 num acerto perfeito
```
- `energia` cai a cada treino; com energia baixa há risco de ganho reduzido.
- Ação **Rest** gasta um turno e devolve energia.
- Turnos contam até a próxima prova da carreira; a prova da carreira entrega os turnos da
  seguinte (ver `docs/tasks/17-horse-career.md`). Provas avulsas gastam 1 turno.

## 7. Rotas da API

A referência completa (corpo, respostas, códigos de erro e exemplos) é o **Swagger**: com o
backend rodando, abra `http://localhost:3000/docs` (JSON cru em `/openapi.json`). A spec fica
em `backend/src/docs/openapi/` e o `npm run docs:check` falha se uma rota ficar sem
documentação. Resumo das rotas do jogo:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/track`, `/track/:id` | catálogo de pistas (`:id` aceita slug) |
| GET | `/skill` | catálogo de skills |
| GET | `/user/me/horses/:horseId` | Uma do usuário (SP, energia, skills e carreira) |
| POST | `/user/me/horses/:horseId/train` · `/rest` · `/new-career` | treino, descanso, nova carreira |
| POST | `/user/me/horses/:horseId/skills` | aprender skill gastando SP |
| POST | `/race/run` | correr (no turno 0, só a prova da carreira) |
| GET | `/user/me/races` | histórico de corridas |

Cadastro, login, perfil e loja (`/user/create`, `/user/login`, `/verify-token`, `/user/me`,
`/user/me/purchase-horse`, `/horse`) estão só no Swagger.

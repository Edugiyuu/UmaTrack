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
desempenho no minigame, do tipo de treino, da afinidade da Uma, do humor, da energia
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
`POST /races` e não é gravada no histórico.

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

## 5. Skills e skill points

- Treinar gera **skill points (SP)** além dos pontos de atributo.
- Skills ficam num catálogo com `cost` em SP, `requirements` (atributo mínimo) e efeito.
- Skills aprendidas ficam gravadas na Uma do usuário e são passadas ao motor de corrida.

Tipos de efeito: `speedBoost`, `accelBoost`, `staminaRecover`, `staminaSave`,
`startDash`, `inclineBoost`, `cornerBoost`, `flatStat`.

## 6. Treino dinâmico

```
ganho = round(base[trainType] * scoreRatio * affinity * moodMult * energyMult * diminishing)
SP    = round(ganho * 0.4) + bônus de acerto perfeito
```
- `energia` cai a cada treino; com energia baixa há risco de ganho reduzido.
- Ação **Rest** gasta um turno e devolve energia + humor.
- Turnos são reabastecidos ao terminar uma corrida (nova "temporada").

## 7. Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/track` | catálogo de pistas |
| GET | `/track/:id` | detalhe de uma pista |
| GET | `/skill` | catálogo de skills |
| GET | `/user/me/horses/:horseId` | Uma do usuário (inclui SP, energia, skills) |
| POST | `/user/me/horses/:horseId/train` | treino dinâmico |
| POST | `/user/me/horses/:horseId/rest` | descansar |
| POST | `/user/me/horses/:horseId/skills` | aprender skill gastando SP |
| POST | `/race/run` | correr numa pista com uma Uma |
| GET | `/user/me/races` | histórico de corridas |

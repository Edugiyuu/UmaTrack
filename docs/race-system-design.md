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
| **Speed** | Velocidade-alvo em cada fase; peso maior em retas e pistas planas. |
| **Stamina** | Tamanho do "tanque" de fôlego; evita o colapso (*exhaustion*) no final. |
| **Power** | Aceleração, largada e **subidas íngremes**; peso maior em pistas com inclinação. |
| **Wit** | Reduz consumo de fôlego, melhora posicionamento e aumenta a chance de ativar skills. |

## 3. Pistas (tracks)

Cada pista é um documento próprio com:

- `distance` (m) e `category`: `sprint` (<= 1400), `mile` (<= 1800), `medium` (<= 2400), `long` (> 2400)
- `surface`: `turf` | `dirt`
- `terrain`: `flat` | `incline` | `rolling` | `technical`
- `segments[]`: a pista é dividida em trechos, cada um com `grade` (inclinação em %),
  `curve` (0–1) e `lengthRatio`. A soma dos `lengthRatio` é 1.
- `statWeights`: quanto cada atributo pesa no desempenho naquela pista.
- `requirements`: mínimos **recomendados** por atributo. Ficar abaixo não bloqueia a
  inscrição, mas aplica penalidade proporcional (ver 4.4).
- `entryFee`, `prizeMoney[]` (por colocação), `fans`, `skillPointReward`.

### Exemplo: pista íngreme

A pista de Nakayama/Kokura tem `terrain: "incline"` e segmentos com `grade` até `+6%`.
Nesses segmentos o custo de fôlego sobe e a velocidade é multiplicada por um fator que
depende de **Power**: uma Uma com Power baixo perde muito mais velocidade na subida
do que uma com Power alto. Por isso a pista declara `requirements.power` alto.

## 4. Motor de corrida

Simulação determinística por *seed*, em ticks de `0.1s`, rodando **no backend**
(o cliente só anima o replay devolvido, para não ser possível forjar resultados).

### 4.1 Estratégias (running style)
`front` (fugitiva), `pace` (ponta-de-lança), `late` (closer), `end` (fechadora).
Cada estratégia tem um multiplicador de velocidade-alvo por fase da corrida.

### 4.2 Fases
`opening` (0–16%), `middle` (16–66%), `final` (66–100%), com *last spurt* nos últimos 20%.

### 4.3 Fôlego (HP)
```
HP = 0.8 * stamina * distanceFactor + baseHP
custo/tick = k * v^2 * gradeMultiplier * (1 - witSaving)
```
Quando o HP zera a Uma entra em *exhaustion* e a velocidade-alvo despenca.

### 4.4 Inclinação e requisitos
```
gradeSpeedFactor = 1 - grade * (0.9 - powerRatio * 0.6)
powerRatio       = clamp(power / requirements.power, 0, 1.5)
```
Um atributo abaixo do requisito da pista gera `shortfallPenalty` sobre a velocidade-alvo,
proporcional ao quanto falta.

### 4.5 Skills
Skills são checadas a cada tick. Cada skill tem gatilho (fase, posição, HP restante,
tipo de terreno). A chance de ativação é `baseChance + wit * 0.0008`. O efeito dura
`duration` segundos.

### 4.6 Resultado
O motor devolve: classificação, tempos, `replay` (posição de cada corredora por tick),
log de skills ativadas e os prêmios.

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

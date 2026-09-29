# Task 25 — Passivas únicas de cada égua

| Campo | Valor |
|---|---|
| **ID** | `25` |
| **Branch** | `feat/horse-passives` (nova: mexe no motor e na recompensa, e pode ser mergeada sozinha) |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | M |
| **Depende de** | — (a parte visual fica melhor com a `23`, mas não depende dela) |
| **Bloqueia** | — |
| **Área** | fullstack |
| **Criada em** | 2026-09-28 |

---

## 1. Contexto
Cada égua do catálogo tem uma passiva escrita em `passiveBuff` ("Sorte de bronze",
"Fuga silenciosa"...), que aparece na loja, na carreira e na seleção de pista. Mas é só
texto. A própria spec da API avisa: "nenhum código aplica esse bônus". Hoje, escolher
Nice Nature ou Silence Suzuka só muda os atributos iniciais e o preço.

## 2. Objetivo
Cada égua tem uma passiva própria que muda de verdade a corrida ou a recompensa, aparece
no replay e é explicada no guia.

## 3. Escopo

### Dentro do escopo

**As cinco passivas.** Os números são uma proposta inicial. O valor final sai da medição
com `career:check` (ver seção 4).

| Égua | Passiva | Quando vale | Efeito proposto | Onde entra |
|---|---|---|---|---|
| Nice Nature | Sorte de bronze | Terminar em 1º, 2º ou 3º | +40% de skill points na recompensa | `raceController` |
| Silence Suzuka | Fuga silenciosa | Largada (fase `opening`); pistas `terrain: "flat"` | Largada ×1,25; +5% de Speed em pista plana | motor |
| Special Week | Coração de campeã | Pela `category` da pista | Stamina +0% sprint · +5% mile · +10% medium · +15% long | motor (antes da largada) |
| Oguri Cap | Monstro cinzento | Pistas `terrain: "incline"`/`"rolling"` ou `surface: "dirt"` | +12% de Power | motor (antes da largada) |
| Grass Wonder | Asas de vidro | Fases `final` e `spurt` | Aceleração ×1,3 | motor |

- [ ] A passiva é **fixa e sempre ativa**: não custa skill points, não sorteia chance nem
      ocupa espaço de skill. Só vale quando a condição da tabela é cumprida.
- [ ] Só a égua do jogador tem passiva. As rivais e o pelotão continuam como estão (as
      rivais são difíceis de propósito, ver task `19`).
- [ ] O texto de `passiveBuff` passa a descrever o efeito real, com número
      (ex.: "Sorte de bronze: +40% de skill points ao terminar no pódio.").
- [ ] O replay informa a passiva da jogadora e quando ela entrou em ação.

**Frontend**
- [ ] Na tela **Suas rivais** (ou no cabeçalho da corrida), um selo com o nome da passiva
      e se ela vale **nesta pista** ("Coração de campeã · +10% Stamina").
- [ ] Passivas de gatilho (Suzuka na largada, Grass Wonder na reta final) mostram o mesmo
      destaque/toast das skills, com a cor de passiva. Sem cutscene (ela continua só para
      skills `unique`, como decidido na task `23`).
- [ ] No resultado, Nice Nature mostra a linha do bônus: "Sorte de bronze +48 SP".
- [ ] Na seleção de pista, a passiva aparece acesa nas pistas em que vale e apagada nas
      outras, para ajudar a escolher a prova.

### Fora do escopo
- **Passivas das rivais.** Seria outra rodada de balanceamento; vira task própria se o
  Eduardo quiser.
- **Fazer o motor ler `grade` e `surface` por trecho.** O motor por turnos ainda ignora
  inclinação (task `14`). Por isso a passiva de Oguri Cap usa o tipo da pista inteira, não
  cada subida. Quando a física de subida voltar, a passiva pode passar a valer por trecho.
- **Evoluir a passiva** (nível, despertar) e **passivas novas** para éguas que ainda não
  têm arte.
- Arte e som próprios da passiva: usa o destaque de skill da `23` e o som de `skillActivate`
  da `24`.

## 4. Abordagem técnica

**A passiva vive no código, não no banco.** O `seed:horses` não roda no boot, então um
campo novo no documento `Horse` não chegaria aos bancos que já existem. A passiva fica num
catálogo em `backend/src/data/passives.ts`, indexada pelo **nome** da égua (a mesma chave
do seed e de `findOwnedHorse`). O `raceController` busca a passiva pelo `catalogHorse.name`
e a passa ao motor. Égua sem entrada no catálogo corre sem passiva.

**Tipos de efeito.** Poucos, e todos reaproveitam o que o motor já tem:

- `statPercent`: soma uma porcentagem ao atributo antes da largada, como as skills
  `flatStat` já fazem em `buildRunnerState`. O valor pode depender da `category` da pista
  (Special Week) ou valer só com certas `terrain`/`surface` (Oguri, e a parte plana da Suzuka).
- `accelPercent`: multiplica a aceleração do turno (o mesmo ponto do `accelBoost`)
  enquanto a fase estiver na lista (`opening` para Suzuka, `final`/`spurt` para Grass).
- `rewardPercent`: não passa pelo motor; o controller multiplica `skillPointsEarned`
  quando a colocação está na faixa (Nice Nature).

A passiva **não chama `rng()`**, então a mesma seed continua gerando a mesma corrida para
as rivais. O resultado da jogadora muda, o que é o esperado.

**Balanceamento.** Rodar `career:check` antes e depois, por égua, e registrar a tabela
aqui (como na task `19`). Meta: cada passiva sobe a taxa de carreira completa da própria
égua sem passar de uns +10 pontos. Nenhuma égua deve virar escolha óbvia. O `careerCheck`
precisa aplicar a passiva para simular o jogo de verdade.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/data/passives.ts` | criar | Catálogo das 5 passivas, por nome da égua |
| `backend/src/data/horses.ts` | editar | Texto de `passiveBuff` com o efeito real |
| `backend/src/types/race.ts` e `frontend/src/types/race.ts` | editar | `RacePassive`, `passive` no runner, `passive` na simulação |
| `backend/src/services/raceEngine.ts` | editar | Aplica `statPercent` e `accelPercent`; registra quando entrou |
| `backend/src/controllers/raceController.ts` | editar | Busca a passiva, passa ao motor, aplica `rewardPercent` e devolve o bônus em `rewards` |
| `backend/src/scripts/raceEngineCheck.ts` | editar | Casos de cada passiva (com e sem condição) |
| `backend/src/scripts/careerCheck.ts` | editar | Simula com a passiva |
| `backend/src/docs/openapi/` | editar | `passive` na simulação, `passiveBonus` em `rewards`, descrição de `passiveBuff` |
| `frontend/src/components/RaceRunner/RaceRivals.tsx` | editar | Selo da passiva antes da largada |
| `frontend/src/components/RaceRunner/useRaceEffects.ts` | editar | Destaque/toast quando a passiva entra |
| `frontend/src/components/RaceRunner/RaceResults.tsx` | editar | Linha do bônus de SP |
| `frontend/src/components/RaceTrackSelect/RaceTrackSelect.tsx` | editar | Passiva acesa/apagada por pista |

**Contratos**

```ts
// backend/src/types/race.ts
export type PassiveEffect =
  | { kind: "statPercent"; stat: StatName; byCategory?: Partial<Record<TrackCategory, number>>; value?: number }
  | { kind: "accelPercent"; value: number; phases: RacePhase[] }
  | { kind: "rewardPercent"; value: number; maxPlacement: number };

export interface RacePassive {
  slug: string;              // "bronze-luck", "silent-escape"...
  name: string;              // "Sorte de bronze"
  description: string;
  effects: PassiveEffect[];
  /** Só vale nestas pistas. Sem `when`, vale em todas. */
  when?: { terrain?: TrackTerrain[]; surface?: TrackSurface[] };
}

// RaceRunnerInput
passive?: RacePassive;

// RaceSimulation
passive: {
  slug: string;
  name: string;
  /** Vale nesta pista (condição de terreno/superfície cumprida). */
  active: boolean;
  /** Primeiro turno de cada janela em que um efeito de gatilho entrou. */
  triggers: { time: number; distance: number }[];
} | null;

// rewards (POST /race)
passiveBonus: { name: string; skillPoints: number } | null;
```

Os efeitos de cada passiva podem ter condições diferentes (a Suzuka tem largada sempre e
Speed só em pista plana). Nesse caso, a condição vai no efeito, não na passiva.

## 5. Plano de execução
1. [ ] Rodar `career:check` e guardar a tabela de antes.
2. [ ] Tipos + `data/passives.ts` + casos no `race:check` (ainda falhando).
3. [ ] Motor: `statPercent` e `accelPercent`, com `passive` no replay. `race:check` passa.
4. [ ] Controller: busca por nome, `rewardPercent`, `passiveBonus`. `careerCheck` com passiva.
5. [ ] Medir e ajustar os números; tabela de depois nesta task.
6. [ ] Spec OpenAPI + `docs:check`.
7. [ ] Frontend: selo pré-largada, destaque de gatilho, linha no resultado, seleção de pista.
8. [ ] Textos de `passiveBuff`, guia, design doc (ver seção 8).

## 6. Critérios de aceite
- [ ] **Dado** Special Week numa pista `long`, **quando** a corrida roda, **então** ela
      larga com +15% de Stamina; numa `sprint`, sem bônus.
- [ ] **Dado** Oguri Cap em Kokura (dirt, incline), **então** o Power dela sobe 12%; em
      Niigata (turf, flat), não.
- [ ] **Dado** Silence Suzuka, **então** a largada dela é 25% mais forte em qualquer pista,
      e o +5% de Speed só vale nas pistas planas.
- [ ] **Dado** Grass Wonder, **quando** a corrida entra na fase `final`, **então** a
      aceleração dela sobe 30% até a chegada e o replay marca o gatilho.
- [ ] **Dado** Nice Nature em 2º, **então** os skill points da recompensa são 40% maiores e
      o resultado mostra a linha "Sorte de bronze +N SP"; em 4º, sem bônus.
- [ ] **Dado** a mesma seed com e sem passiva, **então** as corridas das rivais são
      idênticas (a passiva não consome `rng()`).
- [ ] **Dado** uma rival ou o pelotão, **então** nenhuma passiva é aplicada.
- [ ] **Dado** um replay antigo sem `passive`, **então** a tela de corrida abre normalmente.
- [ ] O selo da passiva aparece antes da largada e diz se ela vale na pista.
- [ ] O texto da loja bate com o efeito aplicado.

## 7. Como verificar

```bash
npm run race:check --prefix backend
npm run career:check --prefix backend
npm run docs:check --prefix backend
npx tsc --noEmit -p backend
npm run build --prefix frontend
```

- Automático: `race:check` com um caso por passiva, com e sem a condição, e o caso da
  seed igual para as rivais.
- Manual: renderizar a tela de corrida e o resultado isolados no dev server, com replays de
  exemplo. **Não rodar corrida contra o backend local**, que usa o banco real.
- Regressão a observar: `career:check` das éguas sem mudar muito; a cutscene da `23`
  continua só para skills `unique`.

## 8. Impacto em documentação
- [ ] `README.md` — sem mudança (atenção: está em UTF-16)
- [ ] `docs/race-system-design.md` — seção de passivas: onde entram no turno e por que
      não usam `rng()`
- [ ] `docs/guia-do-jogador.md` — tabela das éguas com a passiva real e dica de qual pista
      combina com cada uma
- [ ] `docs/UmaSprint-Mecanicas-do-Jogo.pdf` — página das éguas, se o Eduardo quiser
      regerar
- [ ] Spec da API em `backend/src/docs/openapi/` + `npm run docs:check`
- [ ] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Uma passiva forte demais faz todo mundo escolher a mesma égua | médio | Medir com `career:check`; limite de +10 pontos por égua; Eduardo decide o número final |
| Nice Nature: bônus só de SP pode parecer fraco perto das passivas de corrida | médio | Ela já tem o Wit mais alto e é a mais barata; se ficar fraca, somar +fãs no pódio |
| Oguri por tipo de pista e não por subida pode parecer "trapaça" do texto | baixo | O texto diz "em pistas de subida e de terra"; vira por trecho quando o motor ler `grade` |
| Nome como chave quebra se uma égua for renomeada | baixo | Mesma chave que o seed e `findOwnedHorse` já usam; comentário no catálogo |
| Passivas para as rivais? | — | Fora do escopo; o Eduardo decide se vira task |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] Build passa: `npm run build --prefix frontend` e `npx tsc --noEmit` no backend
- [ ] `race:check`, `career:check` e `docs:check` passam
- [ ] Sem `console.log` / código morto deixado para trás
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push na branch `feat/horse-passives`; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-28 | Task planejada. `passiveBuff` era só texto; os efeitos da tabela são proposta a medir. |

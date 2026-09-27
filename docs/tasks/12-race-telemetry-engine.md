# Task 12 — Expor a telemetria da corrida no motor

| Campo | Valor |
|---|---|
| **ID** | `12` |
| **Branch** | `feat/race-telemetry-engine` |
| **Base** | `feat/race-turn-engine` (ou `main`, depois que a `14` entrar) |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | P |
| **Depende de** | `14` |
| **Bloqueia** | `13` |
| **Área** | backend |
| **Criada em** | 2026-09-23 · reescrita em 2026-09-26 para o motor por turnos |

---

## 1. Contexto
O motor por turnos (task `14`, `backend/src/services/raceEngine.ts`) calcula a cada turno
tudo o que o jogador gostaria de ver: a velocidade dela, o teto, quanto ela acelerou,
quanto perdeu ao entrar numa curva, o fôlego gasto no turno, a pressão da fase, o desconto
do Wit, se está cansada e quais skills estão ativas. **Nada disso sai da função.** O replay
entregue ao frontend (`RaceFrame`) carrega só `t`, `positions` e `stamina`.

O resultado é que a corrida é uma caixa-preta. A égua desacelera no fim e o jogador não
sabe se foi a curva, se ela gastou fôlego rápido demais no começo ou se simplesmente faltou
Stamina para a distância.

> Esta task foi escrita originalmente para o motor por ticks (velocidade-alvo, fator de
> inclinação, fator de estilo). Com a troca para turnos ela ficou menor: as regras são
> poucas, e cada número já é uma conta que dá para mostrar ao jogador.

## 2. Objetivo
O replay passa a carregar, **por turno**, a telemetria da égua do jogador — velocidade,
aceleração, perda na curva, gasto de fôlego, pressão e veredito de ritmo — sem mudar em
nada o resultado da simulação.

## 3. Escopo

### Dentro do escopo
- [ ] Tipos `RunnerTelemetry` e `PaceVerdict` em `backend/src/types/race.ts`.
- [ ] Campo `telemetry: RunnerTelemetry[]` em `RaceSimulation`, **um item por turno**, só
      da corredora do jogador (vazio se não houver jogador na prova).
- [ ] Coleta dos valores já calculados no laço do motor, sem recalcular nada.
- [ ] Veredito de ritmo (`safe` / `tight` / `rushed`) derivado do alcance de fôlego.
- [ ] Espelhar os tipos em `frontend/src/types/race.ts` (o frontend tem cópia própria).
- [ ] Estender `backend/src/scripts/raceEngineCheck.ts` para provar que o resultado não
      mudou e que a telemetria fecha com o replay.

### Fora do escopo
- Qualquer pixel. O HUD é a task `13`.
- Telemetria das rivais: multiplicaria o payload por 13 para informação que o jogador não
  usa. Se um dia virar "comparar com a líder", vira task própria.
- Estilo de corrida e inclinação: estão fora do motor por turnos (ver task `14`). Quando
  voltarem, entram aqui como campos novos.
- Mudar o balanceamento. Se um número parecer errado durante a task, vira bug separado.

## 4. Abordagem técnica

Por que **por turno** e não por frame: o motor decide tudo uma vez por turno, e os 4 frames
de cada turno são só interpolação para a animação. Uma lista por turno é menor, não repete
dados, e é exatamente a unidade que o jogador vê no relógio ("Turno 7").

A captura acontece dentro do `states.forEach` do laço de turnos, para a corredora com
`isPlayer`, depois do cálculo do fôlego e antes do movimento. A perda na curva só é
conhecida depois do movimento (é ali que ela entra na curva), então é preenchida no fim da
mesma iteração.

**O conceito central: alcance de fôlego.** Com o gasto do turno atual, dá para projetar
quantos turnos ela ainda aguenta neste ritmo, e quantos metros isso dá:

```
turnosDeFôlego = fôlegoAtual / gastoDoTurno
alcance        = turnosDeFôlego × velocidadeDoTurno      (metros)
```

Comparado com o que falta de pista, isso responde a pergunta que o jogador realmente faz:
*ela está indo rápido demais?*

| Condição | Veredito | Leitura |
|---|---|---|
| `alcance >= restante × 1,15` | `safe` | Sobra fôlego |
| `alcance >= restante × 0,95` | `tight` | No limite, do jeito que tem que ser |
| caso contrário | `rushed` | Vai secar antes da linha |

Como a pressão sobe nos terços seguintes (×1,25 e ×1,5), a projeção com o gasto atual é
otimista no começo. Para o aviso chegar a tempo, o alcance usa a **pressão do último
terço** (×1,5) na projeção, não a do turno atual. Isso deixa o veredito conservador, que é
o lado certo para um aviso.

Quando ela já está cansada, o veredito é sempre `rushed` e `staminaRange` é 0.

**Contratos**

```ts
export type PaceVerdict = "safe" | "tight" | "rushed";

export interface RunnerTelemetry {
  /** Turno, a partir de 1. */
  turn: number;
  phase: RacePhase;
  /** Multiplicador de pressão no gasto de fôlego: 1, 1.25 ou 1.5. */
  pressure: number;
  /** Colocação no início do turno, 1 = líder. */
  placement: number;
  /** Velocidade base no turno, m/turno (sem skills). */
  speed: number;
  /** Velocidade realmente corrida, com as skills de velocidade, m/turno. */
  runSpeed: number;
  /** Teto no turno: Speed, ou Speed / 2 se cansada. */
  ceiling: number;
  /** Quanto ela acelerou neste turno, m/turno (0 no teto ou no turno 1). */
  accel: number;
  /** Velocidade perdida ao entrar numa curva no fim deste turno, m/turno (0 se não entrou). */
  curveLoss: number;
  /** Fôlego gasto neste turno, em pontos de Stamina. */
  staminaCost: number;
  /** Desconto aplicado no gasto (Wit + skills), 0..0,6. */
  staminaSave: number;
  /** Fôlego restante depois do turno, em pontos (pode ficar negativo). */
  stamina: number;
  /** Metros que ela ainda aguenta, na projeção conservadora. */
  staminaRange: number;
  /** Metros que faltavam para a linha no início do turno. */
  remaining: number;
  pace: PaceVerdict;
  tired: boolean;
  /** Tipos de efeito de skill ativos neste turno. */
  effects: SkillEffectKind[];
}

export interface RaceSimulation {
  // ...campos atuais
  /** Telemetria da corredora do jogador, um item por turno. Vazia sem jogador. */
  telemetry: RunnerTelemetry[];
}
```

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/types/race.ts` | editar | `RunnerTelemetry`, `PaceVerdict`, campo em `RaceSimulation` |
| `backend/src/services/raceEngine.ts` | editar | Captura os valores do turno da jogadora |
| `backend/src/scripts/raceEngineCheck.ts` | editar | Determinismo com e sem telemetria; telemetria fecha com o replay |
| `frontend/src/types/race.ts` | editar | Espelha os tipos novos |

**Cuidados**

- A telemetria é **leitura**, nunca entrada: nenhum valor coletado pode voltar a influenciar
  o cálculo, senão o replay muda.
- Não chamar `rng()` na coleta: um sorteio a mais desalinha a sequência e muda a corrida.
- Arredondar na hora de gravar (1 casa para velocidade e fôlego, 3 para frações) para não
  inflar o JSON com dízimas.
- `raceResult` não grava a simulação, então o histórico não cresce; a telemetria vai só na
  resposta de `POST /races`.

## 5. Plano de execução
1. [ ] Declarar os tipos no backend.
2. [ ] Capturar os valores do turno da jogadora no laço do motor.
3. [ ] Calcular alcance de fôlego e veredito de ritmo.
4. [ ] Espelhar os tipos no frontend.
5. [ ] Estender o script de verificação e rodar antes/depois para provar determinismo.
6. [ ] Atualizar `docs/race-system-design.md` com a seção de telemetria.

## 6. Critérios de aceite
- [ ] **Dado** a mesma seed, **quando** a corrida roda antes e depois da task, **então**
      colocações, tempos, frames e fôlego final são idênticos.
- [ ] **Dado** uma prova com jogador, **quando** ela termina no turno N, **então**
      `telemetry` tem N itens, com `turn` de 1 a N e todos os campos numéricos (sem `NaN`,
      sem `Infinity`).
- [ ] **Dado** um turno em que ela entra numa curva, **quando** se lê a telemetria, **então**
      `curveLoss > 0` e a `speed` do turno seguinte é a anterior ÷ 1,2 mais a aceleração.
- [ ] **Dado** a soma de `staminaCost` de todos os turnos, **quando** comparada com
      `Stamina − fôlego final`, **então** as duas batem (fora skills de recuperação).
- [ ] **Dado** uma égua com 30% a menos de Stamina que o requisito de Tokyo, **quando** ela
      passa do primeiro terço, **então** aparece `pace: "rushed"` **antes** de `tired` virar
      `true` — o aviso vem antes do estrago, não junto.
- [ ] **Dado** o payload da resposta, **quando** se compara com o de antes, **então** ele
      cresce menos de 30% (uma corredora, ~25 turnos).

## 7. Como verificar

```bash
npm run race:check --prefix backend
```

- Rodar o script na branch base e na branch da task com a mesma seed; comparar colocações,
  tempos e frames.
- Imprimir a telemetria de uma corrida de Tokyo com pouca Stamina e conferir a ordem:
  `safe` → `tight` → `rushed` → `tired`.
- Regressão a observar: `raceController` devolve a simulação inteira; conferir que o campo
  novo não quebra a tela de corrida atual.

## 8. Impacto em documentação
- [ ] `README.md` — sem mudança
- [x] `docs/race-system-design.md` — nova seção "4.7 Telemetria"
- [ ] `docs/guia-do-jogador.md` — fica para a task `13`, que é onde o jogador vê
- [x] `docs/tasks/README.md`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Captura mal posicionada no laço altera a simulação | alto | Só ler variáveis já calculadas, sem `rng()`; provar com o script de determinismo |
| Projeção de alcance com ×1,5 é pessimista demais no começo e mostra `rushed` para quem vai chegar | médio | Medir com as éguas do seed; se incomodar, projetar com a pressão de cada terço restante |
| Estilos e inclinação voltarem ao motor | baixo | Campos novos e opcionais em `RunnerTelemetry`, sem quebrar o contrato |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npx tsc --noEmit` passa no backend (não existe script `build` lá)
- [ ] Script de verificação rodado e resultado colado no registro de execução
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/race-telemetry-engine`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Task escrita para o motor por ticks. |
| 2026-09-26 | Reescrita para o motor por turnos da task `14`: telemetria por turno em vez de por frame, sem velocidade-alvo, inclinação nem estilo; entram aceleração, perda na curva, pressão e cansaço. Tamanho caiu de M para P. |

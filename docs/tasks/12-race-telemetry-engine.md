# Task 12 — Expor a telemetria da corrida no motor

| Campo | Valor |
|---|---|
| **ID** | `12` |
| **Branch** | `feat/race-telemetry-engine` |
| **Base** | `docs/task-template` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | M |
| **Depende de** | `10` |
| **Bloqueia** | `13` |
| **Área** | backend |
| **Criada em** | 2026-09-23 |

---

## 1. Contexto
O motor (`backend/src/services/raceEngine.ts`) já calcula, a cada tick de 0,1s, tudo o que
o jogador gostaria de ver: velocidade atual e velocidade-alvo, o multiplicador da fase, o
multiplicador do estilo de corrida, quanto a inclinação tira de velocidade, quanto a
inclinação soma no gasto de fôlego, a perda na curva e o fôlego queimado no tick. **Nada
disso sai da função.** O replay entregue ao frontend (`RaceFrame`) carrega só `t`,
`positions` e `stamina`.

O resultado é que a corrida é uma caixa-preta: a égua desacelera no fim e o jogador não tem
como saber se foi a subida, se foi o estilo errado, se ela gastou fôlego rápido demais no
começo ou se simplesmente faltou Speed. A tela de resultado só avisa depois, e só quando
algum atributo ficou abaixo do requisito da pista.

## 2. Objetivo
O replay passa a carregar, por frame, a telemetria da égua do jogador — velocidade, gasto de
fôlego, veredito de ritmo, efeito do estilo e efeito do terreno — sem mudar em nada o
resultado da simulação.

## 3. Escopo

### Dentro do escopo
- [ ] Tipo `RunnerTelemetry` em `backend/src/types/race.ts`.
- [ ] Campo `telemetry` em `RaceFrame`, preenchido **apenas para a corredora do jogador**.
- [ ] Coleta dos valores já calculados no laço do motor, sem recalcular nada.
- [ ] Veredito de ritmo (`safe` / `tight` / `rushed`) derivado do alcance de fôlego.
- [ ] Espelhar o tipo em `frontend/src/types/race.ts` (o frontend tem cópia própria).
- [ ] Estender `backend/src/scripts/raceEngineCheck.ts` para imprimir a telemetria e provar
      que o resultado da corrida não mudou.

### Fora do escopo
- Qualquer pixel. O HUD é a task `13`.
- Telemetria das rivais — multiplicaria o payload por 13 para informação que o jogador não
  usa. Se um dia virar "comparar com a líder", vira task própria.
- Relatório pós-corrida e gráficos históricos.
- Mudar o balanceamento. Se um número parecer errado durante a task, vira bug separado.

## 4. Abordagem técnica

O laço do motor já tem todas as variáveis em mãos no momento certo (`targetSpeed`,
`gradeSpeedFactor`, `gradeDrain`, `curvePenalty`, `STYLE_SPEED[style][phase]`, o fôlego
descontado no tick). A task só as captura, para a corredora com `isPlayer`, na mesma hora em
que o frame é empilhado (a cada `FRAME_EVERY` ticks).

**O conceito central: alcance de fôlego.** Com o gasto por segundo atual e a velocidade
atual, dá para projetar quantos metros ela ainda aguenta neste ritmo:

```
staminaRange = (staminaAtual / gastoPorSegundo) * velocidadeAtual
```

Comparado com o que falta de pista, isso responde a pergunta que o jogador realmente faz —
*ela está indo rápido demais?*:

| Condição | Veredito | Leitura |
|---|---|---|
| `staminaRange >= remaining * 1.15` | `safe` | Sobra fôlego; talvez esteja correndo devagar demais |
| `staminaRange >= remaining * 0.95` | `tight` | No limite, do jeito que tem que ser |
| caso contrário | `rushed` | Vai estourar antes da linha |

Quando o gasto por segundo é ~0 (largada, velocidade ainda baixa) o alcance é tratado como
infinito e o veredito é `safe`.

**Contratos**

```ts
export type PaceVerdict = "safe" | "tight" | "rushed";

export interface RunnerTelemetry {
  /** Velocidade atual, m/s. */
  speed: number;
  /** Velocidade que ela está perseguindo neste instante, m/s. */
  targetSpeed: number;
  phase: RacePhase;
  /** Colocação neste instante, 1 = líder. */
  placement: number;
  /** Fôlego queimado por segundo, como fração 0..1 da barra cheia. */
  drain: number;
  /** Metros que ela ainda aguenta neste ritmo. */
  staminaRange: number;
  /** Metros que ainda faltam para a linha. */
  remaining: number;
  pace: PaceVerdict;
  /** Multiplicador que o estilo aplica na velocidade agora (1 = neutro). */
  styleFactor: number;
  /** Multiplicador que a inclinação aplica na velocidade (1 = plano). */
  gradeSpeedFactor: number;
  /** Multiplicador que a inclinação aplica no gasto de fôlego (1 = plano). */
  gradeDrainFactor: number;
  /** Velocidade perdida na curva, 0..1. */
  curvePenalty: number;
  /** Inclinação do trecho atual, em %. */
  grade: number;
  /** Tipos de efeito de skill ativos agora. */
  effects: SkillEffectKind[];
}

export interface RaceFrame {
  t: number;
  positions: number[];
  stamina: number[];
  /** Telemetria da corredora do jogador. Ausente se não houver jogador na prova. */
  telemetry?: RunnerTelemetry;
}
```

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/types/race.ts` | editar | `RunnerTelemetry`, `PaceVerdict`, campo em `RaceFrame` |
| `backend/src/services/raceEngine.ts` | editar | Captura os valores do tick; monta a telemetria no frame |
| `backend/src/scripts/raceEngineCheck.ts` | editar | Imprime a telemetria; confere determinismo |
| `frontend/src/types/race.ts` | editar | Espelha os tipos novos |

**Cuidados**

- A telemetria é **leitura**, nunca entrada: nenhum valor coletado pode voltar a influenciar
  o cálculo, senão o replay muda.
- Arredondar na hora de gravar (2 casas para velocidade, 3 para frações) para não inflar o
  JSON com dízimas de ponto flutuante.
- `RunnerState` vai precisar guardar os fatores do tick para o frame lê-los — usar campos
  explícitos, não um objeto solto recalculado depois.

## 5. Plano de execução
1. [ ] Declarar os tipos no backend.
2. [ ] Guardar os fatores do tick no `RunnerState` da corredora do jogador.
3. [ ] Montar a telemetria ao empilhar o frame (inclusive no frame final).
4. [ ] Calcular alcance de fôlego e veredito de ritmo.
5. [ ] Espelhar os tipos no frontend.
6. [ ] Estender o script de verificação e rodar antes/depois para provar determinismo.
7. [ ] Atualizar `docs/race-system-design.md` com a seção de telemetria.

## 6. Critérios de aceite
- [ ] **Dado** a mesma seed, **quando** a corrida roda antes e depois da task, **então**
      colocações, tempos e fôlego final são idênticos.
- [ ] **Dado** um frame do replay, **quando** há jogador na prova, **então** ele traz
      `telemetry` com todos os campos preenchidos e numéricos (sem `NaN`, sem `Infinity`).
- [ ] **Dado** uma pista com subida, **quando** a égua entra no trecho íngreme, **então**
      `gradeSpeedFactor < 1` e `gradeDrainFactor > 1` naquele trecho.
- [ ] **Dado** o estilo `end`, **quando** a corrida está na abertura, **então**
      `styleFactor < 1`; no spurt, `styleFactor > 1`.
- [ ] **Dado** uma égua com Stamina muito abaixo do requisito, **quando** ela passa do meio
      da prova, **então** aparece `pace: "rushed"` antes de o fôlego zerar — o aviso vem
      antes do estrago, não junto.
- [ ] **Dado** o payload da resposta, **quando** se compara com o de antes, **então** ele
      cresce menos que 3x (frames a cada 0,5s, telemetria de uma corredora só).

## 7. Como verificar

```bash
npx tsx backend/src/scripts/raceEngineCheck.ts
```

- Rodar o script na branch `main` e na branch da task com a mesma seed; comparar as
  colocações e os tempos linha a linha.
- Conferir o tamanho do JSON do replay antes e depois (o script pode imprimir
  `JSON.stringify(simulation).length`).
- Regressão a observar: `raceController` e o histórico gravam `simulation`; confirmar que o
  campo novo não quebra o schema de `raceResult`.

## 8. Impacto em documentação
- [ ] `README.md` — sem mudança
- [x] `docs/race-system-design.md` — nova seção "4.7 Telemetria"
- [ ] `docs/guia-do-jogador.md` — fica para a task `13`, que é onde o jogador vê
- [x] `docs/tasks/README.md`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Captura mal posicionada no laço altera a simulação | alto | Só ler variáveis já calculadas; provar com o script de determinismo |
| `raceResult` persiste a simulação inteira e o documento cresce | médio | Medir o tamanho; se incomodar, não persistir `telemetry` no histórico (só no replay da resposta) |
| "O estilo está ajudando?" pelo `styleFactor` é o efeito do instante, não o efeito total | médio | Suficiente para o HUD; o veredito real exigiria simular contrafactualmente os 4 estilos — anotado como task futura, não entra aqui |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npm run build --prefix backend` passa
- [ ] Script de verificação rodado e resultado colado no registro de execução
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/race-telemetry-engine`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Task escrita. |

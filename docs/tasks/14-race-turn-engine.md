# Task 14 — Trocar o motor de corrida por um motor por turnos

| Campo | Valor |
|---|---|
| **ID** | `14` |
| **Branch** | `feat/race-turn-engine` |
| **Base** | `main` |
| **Status** | 🔍 Em revisão |
| **Tamanho** | G |
| **Depende de** | — |
| **Bloqueia** | revisão de `12` e `13` (ver seção 9) |
| **Área** | fullstack |
| **Criada em** | 2026-09-26 |

---

## 1. Contexto
O motor atual (`backend/src/services/raceEngine.ts`) roda em ticks de 0,1s e empilha
muitos multiplicadores: fase, estilo, razão stat/requisito com peso por pista,
inclinação, curva, superfície e um gasto de fôlego com expoente 2,4. Ele funciona, mas
ninguém consegue prever o resultado de cabeça, nem o jogador nem quem balanceia.

Existe um modelo mais antigo, feito à mão, **por turnos**, com contas que cabem num
papel. Esta task adota esse modelo, com as correções levantadas na análise abaixo.
Pistas (formato, inclinação, superfície, requisitos) ficam para uma conversa própria:
aqui entra só a mecânica da corrida.

### 1.1 O modelo original
Diagrama de referência: uma uma com Velocidade 120, Força 96, Wisdom 105 e Stamina 108,
numa pista de 1200m formada por retas de 200 / 300 / 300 / 300 / 100 com curvas entre
elas.

| Regra | Fórmula original | No exemplo |
|---|---|---|
| Largada | velocidade inicial = Força / 2 | 48 |
| Aceleração | a cada trecho, velocidade += Força / 2 | 40 + 48 = 88 |
| Teto | a velocidade nunca passa do stat Velocidade | 121 → 120 |
| Curva | velocidade / 1,2 | 88 → 73 |
| Turnos no trecho | `ceil(tamanho / velocidade)` | 200 / 48 → 5 turnos |
| Custo de stamina (por trecho) | `\|Wisdom / divisor − velocidade\|`, divisor 1,5 → 2 → 2,5 ("pressão") | 22, depois 36, depois 78 |
| Sem stamina | Força / 3; velocidade / 2,5 | 32; 120 → 48 |
| Resultado | — | 19 turnos |

Papel de cada stat, como descrito no diagrama:
- **Força:** quanto tempo ela leva para chegar à velocidade máxima (a arrancada).
- **Velocidade:** o teto, ou seja, a velocidade mais alta que ela consegue atingir.
- **Stamina:** por quanto tempo ela consegue manter a velocidade.
- **Wisdom:** ativar as skills na hora certa.

### 1.2 O que se mantém
- Os turnos: são fáceis de entender, de balancear no papel e de mostrar na tela
  ("turno 7: 116 m/turno").
- Um papel claro para cada stat.
- A largada em Força / 2, a perda de 1,2 na curva e a penalidade pesada para quem fica
  sem stamina.

### 1.3 O que foi corrigido
| # | Problema no modelo original | Correção |
|---|---|---|
| 1 | O custo `\|Wisdom/k − v\|` usa módulo. Correr mais devagar pode custar mais, e ter mais Wisdom também pode custar mais. | O custo cresce com a velocidade. O Wisdom só **reduz** o custo. |
| 2 | O custo é cobrado por trecho. A 120, um trecho de 300m e um de 100m custam os mesmos 78. | O custo é cobrado **por turno** e é proporcional a **v²** (ver 4.1). |
| 3 | Metros perdidos: 5 × 48 = 240m num trecho de 200m, e os 40m que sobram somem. | A sobra passa para o trecho seguinte. |
| 4 | Ela acelera só na troca de trecho. A mesma pista, cortada em 8 trechos em vez de 5, deixa a mesma uma mais rápida, e a velocidade anda aos saltos (5 turnos em 48, depois 88 de uma vez). | Ela acelera **um pouco a cada turno** até chegar ao teto. |
| 5 | A "pressão" (1,5 → 2 → 2,5) depende do número do trecho, então explode numa pista com 8 trechos. | A pressão depende do **progresso** (%) da corrida. |
| 6 | Várias umas que terminam no mesmo turno ficam empatadas. | Se o turno empatar, vence quem cruzou a linha antes dentro dele (4.1). |
| 7 | Sem aleatoriedade, stats iguais dão resultados idênticos. | Ruído pequeno com seed (o `createRng` atual), mantendo o determinismo. |
| 8 | O Wisdom tem dois papéis: nas contas ele economiza stamina, no diagrama ele ativa skills. | Fica com os dois, de propósito: reduz o custo de stamina e aumenta a chance de ativar skills. |

## 2. Objetivo
A corrida passa a ser simulada turno a turno com as regras da seção 4.1, que dá para
refazer à mão. O contrato do replay (`RaceSimulation`) continua o mesmo, então a tela
de corrida segue funcionando.

## 3. Escopo

### Dentro do escopo
- [x] Reescrever o laço de `simulateRace` como um laço por turno, com as regras de 4.1.
- [x] Ativação de skills avaliada uma vez por turno, com chance que cresce com Wisdom.
- [x] Desempate pelo turno fracionado.
- [x] Ruído com seed no avanço, sem perder o determinismo.
- [x] `RaceFrame` amostrado 4 vezes por turno (`t` em turnos), para a chegada aparecer
      na fração certa do turno no replay.
- [x] Constantes nomeadas no topo do arquivo (`ACCEL_DIVISOR`, `STAMINA_DIVISOR`,
      `CURVE_DIVISOR`, `PRESSURE`, `WISDOM_RELIEF`...) para balancear sem caçar números.
- [x] Atualizar `backend/src/scripts/raceEngineCheck.ts` com os casos da seção 6.
- [x] Ajustar o replay no frontend se ele assumir `t` em segundos (interpolar entre turnos).

### Fora do escopo
- **Estilos de corrida** (front / pace / late / end). Nesta versão todas as umas correm
  do mesmo jeito. Os estilos voltam numa task própria, por exemplo como variação de
  pressão ou de ritmo por terço de corrida.
- **Stamina em distâncias longas.** Continua para a conversa de pistas, mas ficou menos
  urgente: os `requirements` das pistas já crescem com a distância, e com
  `STAMINA_DIVISOR = 1800` quem está nos requisitos de Tokyo (2400m) chega na linha
  (ver 4.2).
- **Sistema de pistas:** inclinação (`grade`), superfície, `statWeights`, requisitos e o
  formato/tamanho das curvas. Nesta task uma pista é só uma lista de retas e curvas.
- **"Arrancar de novo":** a Força dar chance de voltar a acelerar depois de cansada. Está
  no diagrama, mas não nas contas; fica como questão em aberto (seção 9).
- Telemetria e HUD (tasks `12` e `13`).

## 4. Abordagem técnica

### 4.1 Regras por turno
Para cada uma, a cada turno:

```
turno 1:          v = Força / 2
demais turnos:    v = min(teto, v + Força / ACCEL_DIVISOR)          ACCEL_DIVISOR ≈ 6
entrar em curva:  v = v / CURVE_DIVISOR                              CURVE_DIVISOR = 1,2
avanço:           distância += v   (a sobra continua no trecho seguinte)
pressão:          1,0 no 1º terço · 1,25 no 2º · 1,5 no último
stamina:          stamina -= (v² / STAMINA_DIVISOR) × pressão × (1 − Wisdom / 500)
                                                                     STAMINA_DIVISOR = 1800
stamina ≤ 0:      cansada → Força efetiva = Força / 3, teto = Velocidade / 2
cruzar a linha:   tempo = turno − 1 + (metros que faltavam / v)
```

`teto` = o stat Velocidade (ou Velocidade / 2 quando cansada).

**Por que v² e não v.** A intuição original ("correu mais rápido em pouco tempo e gastou
mais") está certa, mas só funciona se o custo **por metro** subir com a velocidade. Com o
custo por turno proporcional a v, o custo por metro fica constante: correr mais rápido
gasta mais por turno, mas usa menos turnos, e um anula o outro. Com v², o custo por metro
é proporcional a v. Correr 300m a 120 custa 2,5 vezes o que custa a 48, e um trecho mais
longo continua custando mais porque a cobrança é por turno.

**Desempate.** Vence quem termina em menos turnos. Se o turno empatar, vence quem cruzou a
linha antes dentro dele, ou seja, o menor `metros que faltavam / v`. Quase sempre o
resultado é o mesmo de "quem sobrou mais metros". Só muda quando uma estava bem mais perto
da linha, mas mais lenta; nesse caso o turno fracionado é o justo, porque ela de fato
cruza primeiro. O motor atual já interpola o cruzamento assim, e dá para reaproveitar.

### 4.2 Calibração e simulação de referência
`STAMINA_DIVISOR` foi calibrado com os dados reais do jogo, e não com o exemplo do
diagrama. Para cada pista, este é o menor divisor com que uma corredora exatamente nos
`requirements` chega sem cansar:

| Pista | Distância | Requisitos (Vel/Sta/Pow/Wit) | Divisor mínimo |
|---|---:|---|---:|
| Sapporo | 1200 | 60/35/50/30 | 2250 |
| Niigata | 1600 | 75/65/60/70 | 1900 |
| Hakodate | 1800 | 80/90/95/70 | 1700 |
| Kyoto | 2200 | 95/110/90/110 | 1800 |
| Tokyo | 2400 | 110/150/115/100 | 1650 |
| Kokura | 2000 | 95/130/175/90 | 1500 |

Com **1800**, quem está nos requisitos chega no limite do fôlego em todas as pistas
(Sapporo e Niigata cansam nos últimos metros, as outras sobram 0–14%), e 30% a menos de
Stamina cansa e perde em todas elas.

Simulação na pista de 1200m do diagrama (retas de 200 / 300 / 300 / 300 / 100),
`ACCEL_DIVISOR = 6`, `STAMINA_DIVISOR = 1800`:

| Perfil (Vel/For/Wis/Sta) | Final |
|---|---|
| Rápida sem fôlego 140/96/105/70 | **11,62 turnos** |
| Diagrama 120/96/105/108 | 11,93 |
| Equilibrada 110/96/105/140 | 12,47 |

Com o divisor calibrado, a velocista vence os 1200m, porque só fica sem fôlego perto da
linha. O trade-off aparece nas distâncias longas: em Tokyo, uma 140/100/115/100 cansa e
perde para uma 110/150/115/100 (22,8 contra 24,5 turnos). Na primeira versão desta
tabela (divisor 900) a equilibrada vencia os 1200m, mas com 900 todo mundo cansaria em
todas as pistas do jogo.

Protótipo usado para gerar a tabela (sem skills e sem ruído; `K` é o `STAMINA_DIVISOR`).
A mesma conta está em `raceEngineCheck.ts` como `paperRace`, e o motor tem que bater
com ela com uma margem de 3%:

```js
function run(S, F, W, ST, K) {
  const segs = [200, 300, 300, 300, 100], total = 1200;
  let v = F / 2, st = ST, d = 0, turn = 0, seg = 0, segEnd = segs[0];
  while (d < total) {
    turn++;
    const tired = st <= 0;
    const f = tired ? F / 3 : F, cap = tired ? S / 2 : S;
    if (turn > 1) v = Math.min(cap, v + f / 6);
    const p = d / total, press = p < 1 / 3 ? 1 : p < 2 / 3 ? 1.25 : 1.5;
    st -= (v * v / K) * press * (1 - W / 500);
    let frac = 1;
    if (d + v >= total) { frac = (total - d) / v; d = total; } else d += v;
    while (seg < segs.length - 1 && d >= segEnd) { seg++; segEnd += segs[seg]; v = v / 1.2; }
    if (d >= total) return turn - 1 + frac;
  }
}
```

### 4.3 O que reaproveitar do motor atual
- `createRng` (mulberry32) e `clamp`.
- A interpolação do cruzamento da linha, que vira o turno fracionado.
- O disparo de skills (`pendingSkills`, `activations`, efeitos com duração), com a duração
  passando a contar em turnos.
- A montagem de `results`.

Sai desta versão: `statRatio`, `PHASE_SPEED`, `STYLE_SPEED`, a inclinação, a superfície e
o `REFERENCE_SPEED`. Uma pista continua sendo a lista de `segments`: um trecho com
`curve >= 0,4` conta como curva (o mesmo limite que já valia para as skills de curva), e
cada curva em que ela entra divide a velocidade por 1,2.

**Skills em turnos:** os valores de velocidade foram multiplicados por ~6 (m/s → m/turno;
16 m/s de referência ≈ 100 m/turno), as durações divididas por ~5 (mínimo 1 turno) e a
`baseChance` passou a ser por turno (≈ 3,5× a antiga por segundo). Como o seed das skills
roda a cada boot com `$set`, o banco se atualiza sozinho ao subir o backend desta branch.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/services/raceEngine.ts` | editar | Laço por turno com as regras de 4.1 |
| `backend/src/types/race.ts` | editar | Doc de `RaceFrame.t` (turno); unidade da `duration` das skills |
| `backend/src/scripts/raceEngineCheck.ts` | editar | Casos de sanidade da seção 6 |
| `backend/src/data/skills.ts` | editar | `duration` e valores dos efeitos convertidos para turnos |
| `backend/src/models/skill.ts` | editar | Comentários das unidades (turnos) |
| `backend/src/models/raceResult.ts` | editar | Campo `timeUnit` (`seconds` para o histórico antigo, `turns` daqui para frente) |
| `backend/src/controllers/raceController.ts` | editar | Grava `timeUnit: 'turns'` |
| `frontend/src/types/race.ts` | editar | Espelhar o doc de `t` e o `timeUnit` do histórico |
| `frontend/src/utils/raceTime.ts` | criar | `formatTurns` / `formatRaceTime` |
| `frontend/src/components/RaceRunner/*` | editar | Relógio "Turno N", tempo em turnos, velocidade em m/turno |
| `frontend/src/components/RaceHistory/RaceHistory.tsx` | editar | Formata pelo `timeUnit` |
| `frontend/src/components/SkillCatalog/SkillCatalog.tsx` | editar | Durações em turnos, m/turno |
| `frontend/src/components/GuideContent/GuideContent.tsx` | editar | Texto dos atributos, estratégias em pausa |

**Contratos**

```ts
export interface RaceFrame {
  /** Turno da corrida (1, 2, 3...). O frame final pode ser fracionado. */
  t: number;
  /** Metros cobertos por cada corredora, na ordem de `runners`. */
  positions: number[];
  /** Stamina restante de cada corredora, como fração 0..1. */
  stamina: number[];
}

// RaceRunnerResult.finishTime passa a ser em turnos (ex.: 12.47).
```

## 5. Plano de execução
1. [x] Declarar as constantes e reescrever o laço de `simulateRace` por turno (sem skills).
2. [x] Religar as skills: um teste de ativação por turno, com chance que cresce com Wisdom;
       converter `duration` para turnos.
3. [x] Ruído com seed no avanço e desempate pelo turno fracionado.
4. [x] Atualizar `raceEngineCheck.ts` e calibrar `ACCEL_DIVISOR` / `STAMINA_DIVISOR`.
5. [x] Ajustar o replay e a tela de resultado no frontend (tempo em turnos).
6. [x] Atualizar a documentação afetada (ver seção 8).

## 6. Critérios de aceite
- [x] **Dado** as mesmas corredoras e a mesma seed, **quando** a corrida roda duas vezes,
      **então** o resultado é idêntico.
- [x] **Dado** duas umas iguais exceto pela Velocidade, e com Stamina de sobra, **quando**
      correm, **então** a mais rápida vence.
- [x] **Dado** uma velocista com pouca Stamina (140/100/115/100), **quando** corre
      contra uma equilibrada (110/150/115/100) em Tokyo, **então** fica cansada antes do
      fim e perde. *(Mudou de "na pista de 1200m" depois da calibração; ver 4.2.)*
- [x] **Dado** qualquer pista do catálogo, **quando** uma corredora exatamente nos
      requisitos corre contra outra com 30% a menos de Stamina, **então** a primeira
      termina em 15–35 turnos e a segunda cansa e perde.
- [x] **Dado** uma uma entrando numa curva, **quando** o turno é processado, **então** a
      velocidade dela cai para v / 1,2.
- [x] **Dado** uma uma com mais Força, **quando** corre, **então** chega ao teto em menos
      turnos.
- [x] **Dado** um trecho que termina no meio de um turno, **quando** ela o atravessa,
      **então** os metros que sobram contam no trecho seguinte (distância total = soma
      dos avanços).
- [x] **Dado** duas umas que terminam no mesmo turno, **quando** sai o resultado, **então**
      os tempos fracionados são diferentes e decidem a colocação.
- [x] **Dado** o protótipo da seção 4.2, **quando** se roda a mesma pista sem skills e sem
      ruído, **então** os finais batem com a tabela.

## 7. Como verificar

```bash
npm run race:check --prefix backend
```

- Manual: rodar uma corrida pela UI e conferir que o replay anda turno a turno, sem
  saltos estranhos, e que a tela de resultado mostra o tempo em turnos.
- Automático: os casos da seção 6 dentro de `raceEngineCheck.ts`.
- Regressão a observar: `raceController` e `raceResult` gravam `finishTime`. Confirmar que
  o histórico antigo (em segundos) não quebra a tela de histórico.

## 8. Impacto em documentação
- [ ] `README.md` — sem mudança (arquivo em UTF-16, editar com cuidado se precisar)
- [x] `docs/race-system-design.md` — trocar a seção do motor pelas regras por turno
- [x] `docs/guia-do-jogador.md` — explicar o que cada stat faz na corrida
- [x] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| As tasks `12` e `13` (telemetria e HUD) foram escritas para o motor por ticks (`targetSpeed`, `gradeSpeedFactor`, `styleFactor`...) | alto | ✅ Reescritas para o motor por turnos junto com esta task |
| Sem estilos de corrida, as rivais ficam muito parecidas entre si | médio | Aceitável nesta versão; os estilos entram em task própria |
| 2400m quase impossível sem stats altos | médio | ✅ Resolvido pela calibração com os requisitos das pistas (4.2); revisitar na conversa de pistas |
| `inclineBoost` (Escaladora, Coração de Montanha) fica sem efeito, porque o motor ignora a inclinação | médio | Avisado no catálogo e no guia; volta com o sistema de pistas |
| A tela ainda deixa escolher estilo de corrida, que não muda nada | baixo | Avisado no guia; a task de estilos decide se a escolha some ou volta a valer |
| Rodar o backend desta branch e depois o de outra branch regrava o catálogo de skills no banco com as unidades de cada uma | baixo | O seed roda no boot, então cada branch se corrige sozinha ao subir |
| As skills atuais foram calibradas em m/s e segundos | médio | ✅ Convertidas (ver 4.3); o balanceamento fino fica para quando houver partidas reais |
| O histórico gravado tem `finishTime` em segundos; o novo é em turnos | baixo | Mostrar a unidade junto ou marcar os resultados antigos |
| "Arrancar de novo": a Força dá chance de voltar a acelerar depois de cansada? | — | Usuário decide; se sim, vira regra extra na fase cansada |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] `npx tsc --noEmit` passa no backend e `npm run build --prefix frontend` passa
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Commit e push em `feat/race-turn-engine`; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-26 | Task escrita a partir da análise do modelo por turnos original. Estilos de corrida e pistas ficam para depois. |
| 2026-09-26 | Motor por turnos implementado. `STAMINA_DIVISOR` calibrado em 1800 com os requisitos das pistas (4.2); o teste da velocista contra a equilibrada passou de 1200m para Tokyo. `npm run race:check`: todos os casos passam. |
| 2026-09-26 | Frontend em turnos (relógio, tempos, skills, guia) e histórico antigo preservado com `timeUnit`. A tela de corrida não foi testada no navegador: subir o backend regrava o catálogo de skills no banco compartilhado e a corrida exige login. |
| 2026-09-26 | Tasks `12` e `13` reescritas para o motor por turnos. |
| 2026-09-27 | Revisão do PR: um `accelBoost` que dispara no turno 1 agora multiplica a largada (antes expirava sem efeito), e `exhausted` é marcado assim que o fôlego zera, inclusive no último turno. Casos novos no `race:check`. |
| 2026-09-27 | Revisão do PR: o replay ganha uma amostra no instante exato de cada chegada, para a animação mostrar o desempate no tempo e na ordem reais (antes podia atrasar até 0,25 turno). Conferido em 240 corridas geradas. |

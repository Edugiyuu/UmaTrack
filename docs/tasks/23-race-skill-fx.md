# Task 23 — Efeitos visuais da corrida (skills, largada, reta final e HUD vivo)

| Campo | Valor |
|---|---|
| **ID** | `23` |
| **Branch** | `feat/race-visual-effects` |
| **Base** | `main` |
| **Status** | 🔍 Em revisão |
| **Tamanho** | G, feita em partes (A–D), um commit por parte |
| **Depende de** | `15` (tela de corrida v2) |
| **Bloqueia** | `24` (música e som do jogo) |
| **Área** | frontend |
| **Criada em** | 2026-09-28 |

---

## 1. Contexto
A corrida v2 (task `15`) mostra tudo em números, mas não parece um evento. Uma skill
ativada é só uma linha no painel da direita. A largada começa do nada, a reta final passa
sem ninguém notar, a pressão aparece como "×1,2" num card e os números do HUD trocam de
repente.

O Eduardo aprovou sete estados no Figma **UmaTrackGUI**, todos clones da *Race v2*
(node `2205:4`). Os estados "exausta" e "pelotão sob pressão" foram descartados, e os
frames foram renumerados de 1 a 7.

| # | Estado | Node |
|---|---|---|
| 1 | Skill ativa: destaque em quem usou | [`2229:166`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2229-166) |
| 2 | Cutscene de skill `unique` | [`2229:346`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2229-346) |
| 3 | Skill de fôlego | [`2229:526`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2229-526) |
| 4 | Skill de velocidade | [`2229:706`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2229-706) |
| 5 | Largada (contagem) | [`2236:4`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2236-4) |
| 6 | Reta final | [`2236:364`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2236-364) |
| 7 | HUD vivo (fôlego baixo) | [`2236:544`](https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2236-544) |

Os frames 5–7 têm uma nota amarela embaixo com a animação e o som de cada estado. Os
nomes e números de skill nos frames são exemplos ("Respiro +15%", "Arranque final +18%").
Na tela entram as skills e os valores reais de `backend/src/data/skills.ts`.

O **som** fica para a task `24`, na mesma branch. Esta task só deixa os eventos prontos
(parte D). Os arquivos de áudio ficam com o Eduardo.

## 2. Objetivo
A corrida marca a largada, mostra na pista quem ativou cada skill e o que ela fez, avisa
quando entra na reta final, e mexe os números do HUD de forma
contínua. Nada muda no motor, e os ganchos de som ficam prontos.

## 3. Escopo

### Dentro do escopo

#### Parte A — Skills (frames 1–4)
**1. Skill ativa (qualquer corredora)**
- [x] A bolinha de quem ativou ganha halo e anel por ~1 turno: dourado para a égua do
      jogador, na cor da rival para as rivais.
- [x] Quando a skill é do jogador, as outras bolinhas esmaecem (opacidade ~0,4) durante o
      destaque, e o balão "VOCÊ · Nº" mostra o nome da skill ("✦ Concentração!").
- [x] Toast na pista: "VOCÊ ativou ✦ Concentração", ou "Rival B ativou ✦ Arranque".
- [x] A câmera LIVE fica dourada ("✦ SKILL · VOCÊ"); a linha do feed "Skills" e o card
      "Skills ativas" brilham.

**2. Cutscene (só skills `unique` da égua do jogador)**
- [x] Só as skills de raridade `unique` abrem cutscene. Skills comuns e raras, e as
      skills das rivais, ficam só com o destaque do item 1.
- [x] Sobreposição de tela cheia: escurecimento, barras de cinema, faixa diagonal em
      gradiente, arte da égua, nome da skill enorme, descrição e selos de efeito, e o
      rodapé "toque para pular ›".
- [x] Dura ~1,8 s, pausa a reprodução e some com clique, espaço ou Esc.
- [x] Não abre em 4x nem com "Pular p/ resultado". Nesses casos fica só o destaque do item 1.

**3. Skill de fôlego (`staminaRecover`)**
- [x] O card de Fôlego fica verde e brilhando, com o selo "+N%"; a barra mostra em verde a
      parte recuperada.
- [x] A bolinha ganha halo verde e partículas "+", e o balão mostra "+N% FÔLEGO".
- [x] O alerta e o card de Ritmo refletem a recuperação.

**4. Skill de velocidade (`speedBoost`, `accelBoost`, `startDash`)**
- [x] Linhas de velocidade animadas sobre a pista e brilho azul nas bordas enquanto o
      efeito dura.
- [x] Rastro azul atrás da bolinha do jogador; o balão mostra o ganho ("▲ +8 m/turno").
- [x] O card de Velocidade fica azul e diz quanto a skill somou.

#### Parte B — Largada e reta final (frames 5 e 6)
**5. Largada**
- [x] Antes do turno 0, as corredoras ficam nos portões e a pista escurece com a contagem
      "3 · 2 · 1 · VAI!" (~0,6 s por número, ~0,25 s em 4x). O número entra grande e encolhe.
- [x] No "VAI!" os portões abrem e a reprodução começa. Clique ou espaço pulam a contagem.
- [x] Depois do turno 1: selo "BOA LARGADA!" ou "LARGOU MAL" para a égua do jogador.
- [x] Voltar com ← até o início não repete a contagem.

**6. Reta final**
- [x] Na primeira vez que a égua do jogador entra na fase `spurt` (últimos 20% da prova),
      um banner inclinado "RETA FINAL" com "FALTAM N m" entra, fica ~1,5 s e sai.
- [x] Nada mais muda na tela, só o trecho "Reta final" da faixa de segmentos ganha destaque.
- [x] Esse é o gancho para trocar a música pela trilha tensa (parte D).

#### Parte C — HUD vivo (frame 7)
**7. HUD vivo**
- [x] Os números de Velocidade, Fôlego, Pressão e distância rolam até o novo valor
      (~300 ms), com seta de tendência ("▲ 0,6").
- [x] As barras drenam e enchem de forma contínua.
- [x] Fôlego abaixo de 25%: o card pulsa em vermelho (borda, número e barra) até recuperar.
      O alerta vira "FÔLEGO BAIXO".
- [x] O alerta entra deslizando quando a frase muda.

#### Parte D — Ganchos de som (sem os áudios)
- [x] Um módulo `raceAudio` com os eventos abaixo, volume e mudo guardados no
      `localStorage`, e um botão 🔊/🔇 no cabeçalho, ao lado das velocidades.
      Sem áudio configurado, nada toca e nada quebra.

| Evento | Quando |
|---|---|
| `countdownTick` | Cada número da contagem |
| `gatesOpen` | "VAI!" |
| `skillActivate` | Ativação de skill (a cutscene pode ter som próprio: `cutscene`) |
| `finalStretch` | Entrada na fase `spurt`; troca a música para a trilha tensa |
| `finish` | Égua do jogador cruza a linha |

#### Gerais
- [x] `prefers-reduced-motion: reduce`: sem cutscene, contagem animada, linhas,
      partículas, pulsos ou números rolando. Ficam cor e texto.
- [x] Os efeitos seguem a reprodução: pausar congela; ← e → mostram o estado do turno.
      Eventos de uma vez só (cutscene, contagem, banner, selos) não se repetem ao voltar.
- [x] Um selo por vez na pista, numa fila. O banner da reta final e a cutscene têm prioridade.
- [x] 375px sem rolagem horizontal; no celular, linhas e brilhos ficam mais fracos para não
      esconder o HUD.

### Fora do escopo
- **O estado "exausta" (vinheta escura com fôlego 0).** Foi descartado no Figma. Com
  fôlego 0 o card de Fôlego só continua vermelho, como no item 7.
- **O estado "pelotão sob pressão"** (card de Pressão laranja/vermelho, aura nas
  corredoras perto, selo "PELOTÃO APERTADO"). Foi descartado no Figma. O card de Pressão
  só ganha os números rolando do item 7.
- **Mudanças no motor ou na API.** Tudo sai do replay que já existe.
- **Cutscene para a passiva da égua ou para skills que não são `unique`.**
- **Os arquivos de áudio e a mixagem**, que ficam com o Eduardo.
- Skills `flatStat`, que entram nos atributos antes da largada e não disparam na corrida.

## 4. Abordagem técnica

**De onde vem cada efeito.** Nada é recalculado a partir dos atributos.

| Efeito | Fonte no replay (`RaceSimulation`) |
|---|---|
| Quem ativou e quando | `activations[]`: `runnerId`, `skillSlug`, `time` (turno, 0 na largada) |
| Tipo e raridade da skill | `skillSlug` → `effect.kind` / `rarity` pelo catálogo de `getSkills()` |
| Velocidade ativa e ganho | `telemetry[t].effects` e `runSpeed − speed` |
| Fôlego recuperado | Ativação `staminaRecover` + diferença de `stamina` entre turnos, em % de `maxStamina` |
| Boa largada / largou mal | Colocação no começo do turno 2 (`telemetry[1].placement`): metade da frente do páreo é boa largada. No começo do turno 1 estão todas empatadas na linha, então não serve de comparação |
| Reta final | Primeiro turno com `telemetry[t].phase === "spurt"` |
| Fôlego baixo | `stamina / maxStamina < 0.25` |

**Um hook, estado derivado.** `useRaceEffects(simulation, playback, skills)` lê só o
instante da reprodução e o replay e devolve o que está ativo agora: destaques, cutscene,
boost, ganho de fôlego, contagem, veredito da largada, reta final e fôlego baixo. Assim pausar, voltar e avançar funcionam sem estado extra. Eventos de uma
vez só usam um `Set` de já vistos. O `raceAudio` escuta as transições do mesmo hook, então
som e visual saem do mesmo lugar.

**Onde cada peça entra**
- `RaceOval.tsx`: halo, anel, rastro, partículas, portões e balão
  variável, numa camada SVG à parte para não re-renderizar as bolinhas `memo`.
- `RaceFxOverlay.tsx` (novo): linhas de velocidade e brilho de borda, com
  `pointer-events: none` e animação só em CSS (`transform` e `opacity`).
- `RaceCutscene.tsx` (novo): diálogo modal (`role="dialog"`, foco preso, Esc fecha), com
  arte de `horseImages` e gradiente na cor da égua.
- `RaceCountdown.tsx` e `RaceBanner.tsx` (novos): contagem, selo da largada, banner da reta
  final e fila de selos.
- `RaceHud.tsx`: variantes `boost`, `heal` e `danger`, `useTween` nos números, barras
  contínuas, pulso de fôlego baixo e alerta deslizando.
- `RaceCam.tsx`: variante `skill` (dourada).
- A cutscene e a contagem pausam forçando o `playing` que o `RaceRunner` já passa ao
  `useRacePlayback`.
- Tokens CSS: `--fx-skill` `#ffb81a`, `--fx-heal` `#22c773`, `--fx-boost` `#4fadff`,
  `--fx-danger` `#e03838`.
- **Animações com GSAP** (pedido do Eduardo): a contagem, o banner da reta final, a
  entrada da cutscene, os selos, o alerta do HUD, as linhas de velocidade e os números
  rolando (`useTween`). Os pulsos em loop (anel da skill, "+" do fôlego, fôlego baixo)
  ficaram em CSS. Tudo checa `prefers-reduced-motion` antes de animar.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/RaceRunner/useRaceEffects.ts` | criar | Deriva todos os efeitos do instante da reprodução |
| `frontend/src/components/RaceRunner/RaceFxOverlay.tsx` / `.css` | criar | Linhas de velocidade e brilho de borda |
| `frontend/src/components/RaceRunner/RaceCutscene.tsx` / `.css` | criar | Cutscene das skills `unique` |
| `frontend/src/components/RaceRunner/RaceCountdown.tsx` / `.css` | criar | Contagem, portões e selo da largada |
| `frontend/src/components/RaceRunner/RaceBanner.tsx` / `.css` | criar | Banner da reta final e fila de selos |
| `frontend/src/components/RaceRunner/RaceOval.tsx` | editar | Camada de efeitos por corredora, portões |
| `frontend/src/components/RaceRunner/RaceHud.tsx` / `.css` | editar | Variantes, números interpolados, barras, pulso, alerta |
| `frontend/src/components/RaceRunner/RaceCam.tsx` | editar | Variante `skill` |
| `frontend/src/components/RaceRunner/RaceHeader.tsx` | editar | Botão de som |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` / `.css` | editar | Catálogo de skills, hook, toasts, espera da contagem e da cutscene |
| `frontend/src/hooks/useTween.ts` | criar | Interpolação de números |
| `frontend/src/services/raceAudio.ts` | criar | Eventos de som, volume e mudo |
| `docs/guia-do-jogador.md` | editar | O que cada efeito quer dizer, reta final, botão de som |

## 5. Plano de execução
1. [x] `useRaceEffects` e `useTween`, conferidos contra um replay real do mock.
2. [x] **Parte A:** destaque de skill, toast, câmera e feed; fôlego e velocidade; cutscene.
3. [x] **Parte B:** contagem, portões, selo da largada; banner da reta final.
4. [x] **Parte C:** HUD vivo.
5. [x] **Parte D:** `raceAudio` com os eventos e o botão de som.
6. [x] Movimento reduzido, 4x, 375px e fila de selos.
7. [x] Guia do jogador e tabela de status.

## 6. Critérios de aceite
- [x] **Dado** uma rival que ativa uma skill, **quando** a reprodução passa pelo turno,
      **então** a bolinha dela ganha halo na cor dela e o toast diz o nome dela e da skill.
- [x] **Dado** a égua do jogador ativando Concentração, **quando** acontece, **então** a
      bolinha fica dourada, as outras esmaecem, o balão diz "✦ Concentração!" e a câmera
      LIVE fica dourada por ~1 turno.
- [x] **Dado** Segundo Fôlego, **quando** ativa, **então** o card de Fôlego fica verde com
      "+N%", onde N é o que o turno realmente recuperou.
- [x] **Dado** um turno com `speedBoost`, **quando** é mostrado, **então** há linhas de
      velocidade e o card mostra o ganho; elas somem quando o efeito acaba.
- [x] **Dado** Último Fôlego (`unique`) do jogador em 1x ou 2x, **quando** ativa, **então**
      a cutscene abre, a corrida pausa, e clique, espaço ou Esc fecham e retomam. Em 4x não abre.
- [x] **Dado** uma skill que não é `unique` (do jogador ou de rival), ou uma `unique` de
      rival, **quando** ativa, **então** não há cutscene, só o destaque.
- [x] **Dado** uma corrida nova, **quando** a tela abre, **então** a contagem roda e a
      reprodução só começa no "VAI!"; um clique pula direto para a largada.
- [x] **Dado** a égua ganhando posições no turno 1, **quando** ele termina, **então**
      aparece "BOA LARGADA!". Perdendo posições, "LARGOU MAL".
- [x] **Dado** a entrada nos últimos 20%, **quando** acontece, **então** o banner "RETA
      FINAL" passa uma vez e o evento `finalStretch` dispara.
- [x] **Dado** o fôlego abaixo de 25%, **quando** o turno é mostrado, **então** o card pulsa
      em vermelho, e para se ela recuperar.
- [x] **Dado** números mudando de um turno para outro, **quando** acontece, **então** eles
      rolam até o novo valor.
- [x] **Dado** ← até antes de uma ativação e → de novo, **quando** a reprodução cruza a
      ativação outra vez, **então** o destaque aparece, mas a cutscene e os selos não repetem.
- [x] **Dado** o som em mudo, **quando** a página recarrega, **então** continua mudo.
- [ ] **Dado** `prefers-reduced-motion`, **quando** a corrida roda, **então** só cor e texto
      mudam.
- [x] **Dado** 375px, **quando** a corrida roda, **então** não há rolagem horizontal.

## 7. Como verificar

```bash
npm run dev --prefix frontend
```

Nunca contra o backend local: ele usa o banco real e correr gasta o save. Usar um mock da
API como nas tasks `13` e `15`, com `simulateRace` de verdade e o catálogo do seed. A égua
do mock deve ter Concentração, Segundo Fôlego, Passo Relâmpago e Último Fôlego, pouca
Stamina (para passar de 25%) e correr numa pista longa (para ver os três terços). Apagar o
mock no fim.

- Manual: `/Race/:horseId/:trackSlug` em 1x, 2x e 4x, em 1430px e 375px, com movimento
  reduzido emulado, comparando com os sete frames do Figma. Para os eventos de som, um
  `console.debug` temporário em `raceAudio`, removido antes do commit.
- Automático: `npm run build --prefix frontend` e `npm run lint --prefix frontend`.
- Regressão a observar: animação fluida em 4x com 14 corredoras; atalhos da task `13`;
  modal de resultado; o HUD continua mudo quando não há nada a dizer.

## 8. Impacto em documentação
- [x] `docs/guia-do-jogador.md`: o que cada efeito quer dizer, reta final, botão de som
- [x] `docs/tasks/README.md` (linha da tabela + status)
- N/A `README.md`, `docs/race-system-design.md` e a spec da API: nada muda no motor nem nas rotas.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Contagem em toda corrida e cutscene com pausa cansam | médio | Um clique pula; mais curtas em 4x; cutscene só para `unique` do jogador |
| Muitos efeitos ao mesmo tempo poluem a tela | médio | Fila de selos, com prioridade para o banner e a cutscene |
| Linhas, brilhos e pulsos pesam em 4x ou no celular | médio | Só CSS com `transform`/`opacity`, camada fora das bolinhas `memo`, versão mais fraca no celular |
| Autoplay de áudio bloqueado pelo navegador | baixo | O primeiro som só toca depois de uma interação; pular a contagem já conta |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [x] `npm run build --prefix frontend` passa; `npm run lint --prefix frontend` só acusa o erro antigo de `TrackCard.tsx`, fora desta task
- [x] Sem `console.log`/`console.debug` / código morto deixado para trás; mock apagado
- [x] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/race-visual-effects`; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-28 | Oito estados desenhados no Figma pelo MCP Talk to Figma e aprovados pelo Eduardo; o estado "exausta" foi descartado. Task criada. |
| 2026-09-28 | Frame "Pelotão sob pressão" descartado; frames renumerados de 1 a 7 e alinhados no Figma. Cutscene só para skills `unique`. |
| 2026-09-28 | Implementada. Notas abaixo. |

**O que mudou de rumo**
- **Um commit só** em vez de um por parte: as quatro partes mexem nos mesmos arquivos
  (`RaceRunner.tsx`, `RaceHud.tsx`) e não havia como separar sem commits que não compilam.
- **GSAP** nas animações, a pedido do Eduardo no meio da implementação (ver seção 4).
- **Janela de uma skill:** uma ativação com `time = n` age no turno `n + 1`, ou seja, no
  intervalo `(n, n + 1]`. O destaque e o evento seguem esse intervalo; assim, ao
  avançar com → até o fim de um turno, nada do turno seguinte aparece antes da hora.
- **Duas skills dela no mesmo turno** (comum: Segundo Fôlego e Último Fôlego juntas):
  a `unique` fica com o balão e a câmera, e a recuperação continua aparecendo no cartão
  de Fôlego.
- **Fila de selos:** até 3 esperando, os dela e o da largada na frente dos das rivais, e
  um selo com mais de 2 turnos de atraso é descartado (senão, ao avançar vários turnos
  com →, apareciam selos velhos). Pausado, a fila espera.
- **O banner espera a cutscene fechar** para cruzar a tela; antes ele passava escondido
  atrás dela.
- **A faixa da cutscene** usa o gradiente do Figma (violeta, magenta, coral), não a cor
  da égua: na Oguri Cap, cinza, a faixa ficava apagada.
- **O HUD na contagem** mostra os números do turno 1 com o aviso "Largada", não "0,0
  m/turno": o replay não tem um turno 0.
- **"FALTAM N m" do banner** é o que faltava no começo do primeiro turno em `spurt`. Com
  éguas rápidas (400+ m/turno) isso pode ser menos de 100 m, porque o turno anterior
  começou antes dos últimos 20%.
- `raceAudio` emite os eventos, mas nenhum som está registrado; os arquivos ficam para a
  task `24`. O mudo fica em `localStorage` (`umasprint:race-audio:muted`).

**Como foi verificado.** Nunca contra o backend local. Um mock em memória (fora do
repositório) serviu `simulateRace` e `generateRivals` de verdade com os catálogos do seed,
Oguri Cap com Concentração, Segundo Fôlego, Passo Relâmpago e Último Fôlego, Stamina 260,
na Tokyo Classic (2400 m). O frontend rodou em `--mode mock`.

| Cenário | Resultado |
|---|---|
| Rivais → Largar | Contagem 3 · 2 · 1 · VAI! (~600 ms por número, ~280 ms em 4x), portões na pista, aviso "Largada" no HUD |
| Turno 1 | Concentração: halo dourado, outras esmaecidas, câmera "✦ SKILL · VOCÊ", balão "✦ Concentração!", linhas de velocidade e brilho azul, card Velocidade azul |
| Depois do turno 1 | Selo "BOA LARGADA! · 1º após o turno 1" |
| Turno 8 em 1x | Cutscene do Último Fôlego → banner RETA FINAL → selo do Segundo Fôlego, um de cada vez; Fôlego verde "+18%", barra com a parte verde, trecho "Últimos 300m" destacado |
| Fôlego < 25% | Card vermelho pulsando, alerta "FÔLEGO BAIXO" |
| 4x | Sem cutscene |
| Clique / Esc na cutscene | Fecha; a corrida volta ao estado anterior (pausada se estava) |
| 375 px | Sem rolagem horizontal; contagem menor; cutscene legível |
| Mudo + recarregar | Continua mudo |

**Tela sem rolagem (pedido do Eduardo depois da revisão).** Em janelas de desktop
(1101 px ou mais de largura, 620 px ou mais de altura) a corrida ocupa exatamente a
altura da janela: o oval encolhe para caber, as câmeras acompanham a altura, e abaixo de
820 px de altura as câmeras e o HUD ficam mais compactos. Conferido em 1904×915 e
1366×680: nada rola e a classificação e as skills aparecem inteiras. Telas menores
continuam rolando. Junto veio uma correção: depois que ela cruza a linha, o boost, a
recuperação e a seta de tendência do último turno deixam de aparecer.

Não deu para emular `prefers-reduced-motion` no navegador do app; o caminho foi
conferido no código (cutscene não abre, GSAP não anima, loops em CSS desligam). Esse
critério fica aberto até alguém testar com a opção ligada no sistema.

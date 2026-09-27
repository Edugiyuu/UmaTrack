# Task 15 — Telas v2 de treino e de corrida (design do Figma)

| Campo | Valor |
|---|---|
| **ID** | `15` |
| **Branch** | `feat/ui-v2-train-race` |
| **Base** | `feat/race-telemetry-hud` (a corrida v2 usa o HUD e a pausa da task `13`) |
| **Status** | 🔍 Em revisão |
| **Tamanho** | M |
| **Depende de** | `13` |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
As telas de treino (`CareerMenu`) e de corrida (`RaceRunner`) foram redesenhadas no Figma,
no arquivo **UmaTrackGUI** (time *Eduardo Santos's team*), a partir dos rascunhos do
Eduardo:

- Treino: frame **TrainScreen v2** — <https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2203-4>
  (rascunho original: **TrainScreen**, node `260:31`).
- Corrida: frame **Race v2** — <https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2205-4>
  (rascunho original: **Desktop - 4**, node `268:18`).

Hoje o treino é uma coluna centralizada com um GIF, uma lista de textos e quatro botões
"Train" sem hierarquia, e não mostra o que cada ação custa. A corrida já tem HUD, pausa e
passo a passo (task `13`), mas a pista é uma pilha de raias retas e não há câmera,
classificação nem noção de onde a égua está na volta.

## 2. Objetivo
As duas telas passam a seguir o design v2 do Figma, usando só dados que o jogo já tem.

## 3. Escopo

### Dentro do escopo
**Treino (TrainScreen v2)**
- [x] Arte grande da égua à esquerda, sobre um painel diagonal na cor dela (`horseColors`),
      com a sombra dura deslocada que o Eduardo adicionou no Figma.
- [x] Cabeçalho: nome, passiva num selo e card de turnos restantes.
- [x] Faixa de status: energia (barra), humor (estrelas), skill points, fãs, vitórias/corridas.
- [x] Grid 2×2 de atributos (Speed, Stamina, Power, Wit): nota, valor, progresso até a
      próxima nota e botão **Treinar** com o custo de energia.
- [x] Ações: **Descansar**, **Ver skills** (abre/fecha o `SkillPanel`) e **Start race!**
      com o custo de energia; desabilitados com o motivo quando não dá.
- [x] Avisos e erros (`notice` / `error`) e o `TrainMiniGame` continuam funcionando.

**Corrida (Race v2)**
- [x] Cabeçalho: pista e etiquetas; relógio "Turno N / total"; transporte, velocidades e
      pular (mesmos controles e atalhos da task `13`).
- [x] Pista oval em SVG: corredoras como bolinhas andando pela volta, a do jogador maior,
      com halo e balão "VOCÊ · Nº"; linha de chegada; distância e progresso no gramado.
- [x] Câmera **LIVE** (a égua do jogador) e câmera **1º LUGAR** (quem lidera).
- [x] Classificação ao vivo com a diferença em metros para o líder.
- [x] Feed de skills ativadas (o que já existia no painel "Skills").
- [x] HUD restilizado: alerta em pílula, Fôlego em destaque (rosa), mesmas leituras e regras
      da task `13` (silêncio, uma frase por vez, esconder).
- [x] Perfil da pista como faixa de segmentos com o marcador da égua.
- [x] Responsivo até 375px, sem rolagem horizontal.

### Fora do escopo
- Mudanças no backend ou no motor. Nada é recalculado a partir dos atributos.
- Tela de seleção de pista e modal de resultado (continuam como estão).
- Arte das rivais: elas não têm imagem, então a câmera de 1º lugar mostra as cores e a
  inicial dela quando a líder é uma rival.
- Um sistema de notas no backend: a nota é só exibição (ver seção 4).

## 4. Abordagem técnica

**Nota dos atributos.** O jogo não tem nota de atributo. A v2 mostra uma, então ela nasce
como escala de exibição em `frontend/src/constants/statRank.ts`, calibrada nos requisitos
das pistas (Sapporo pede ~30–60; Kokura, a mais dura, até 175):

| Nota | G | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| A partir de | 0 | 40 | 60 | 80 | 100 | 125 | 150 | 180 |

A barra do card mostra o progresso da nota atual até a próxima, e o texto diz quantos
pontos faltam. O "/ 1200" do Figma era placeholder e saiu.

**Pista oval.** O motor é linear (metros de 0 a `distance`); a tela desenha uma volta só,
qualquer que seja a distância. O progresso `posição ÷ distância` vira um ponto no contorno
de um retângulo arredondado (`getPointAtLength` de um `<path>` SVG), com largada e chegada
na reta de baixo. Cada corredora ganha uma faixa (interna/meio/externa, pela raia) para as
bolinhas não se sobreporem por completo. Os pontos são calculados por frame; as bolinhas
são `memo` como as raias eram.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/CareerMenu/CareerMenu.tsx` | editar | Layout v2 |
| `frontend/src/components/CareerMenu/CareerMenu.css` | reescrever | Estilo v2, sobre os tokens |
| `frontend/src/constants/statRank.ts` | criar | Escala de notas de exibição |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Grid v2: câmeras, pista, laterais, HUD |
| `frontend/src/components/RaceRunner/RaceRunner.css` | reescrever | Estilo v2 |
| `frontend/src/components/RaceRunner/RaceHeader.tsx` | editar | Relógio "Turno N / total" |
| `frontend/src/components/RaceRunner/RaceOval.tsx` | criar | Pista oval em SVG |
| `frontend/src/components/RaceRunner/RaceCam.tsx` | criar | Card de câmera |
| `frontend/src/components/RaceRunner/RaceStandings.tsx` | criar | Classificação ao vivo |
| `frontend/src/components/RaceRunner/TrackStrip.tsx` | criar | Faixa de segmentos com marcador |
| `frontend/src/components/RaceRunner/RaceLane.tsx` | remover | Substituída pela pista oval |
| `frontend/src/components/RaceRunner/RaceHud.tsx` / `.css` | editar | Alerta na barra, leitura `featured` (Fôlego), visual v2 |
| `frontend/src/components/RaceRunner/format.ts` | editar | `formatClock` vira `currentTurn` (o relógio mostra "N / total") |
| `frontend/src/components/ui/Panel/` | remover | Só a corrida usava; as laterais v2 têm cabeçalho próprio |
| `docs/guia-do-jogador.md` | editar | Notas dos atributos e a tela da corrida |

## 5. Plano de execução
1. [x] Registrar a task (este arquivo) e a linha no README.
2. [x] Treino v2.
3. [x] Corrida v2: cabeçalho, pista oval, câmeras, classificação, skills.
4. [x] HUD v2 e faixa de segmentos.
5. [x] Verificar com mock da API (nunca contra o backend local, que usa o banco real).
6. [x] Build, lint e documentação.

## 6. Critérios de aceite
- [x] **Dado** uma égua no treino, **quando** a tela abre, **então** o jogador vê energia,
      humor, turnos, skill points, fãs, a nota de cada atributo e o custo de cada ação.
- [x] **Dado** energia abaixo de 35, **quando** o jogador olha "Start race!", **então** o
      botão está desabilitado e diz quanto de energia falta.
- [x] **Dado** "Ver skills", **quando** o jogador clica, **então** o painel de skills
      aparece (e some no segundo clique).
- [x] **Dado** uma corrida, **quando** ela roda, **então** as bolinhas andam pela volta e a
      do jogador chega à linha de chegada quando cruza a meta.
- [x] **Dado** a liderança trocando de mãos, **quando** acontece, **então** a câmera de 1º
      lugar e a classificação mudam junto.
- [x] **Dado** pausa e passo a passo (espaço, ←, →), **quando** usados, **então** funcionam
      como na task `13`.
- [x] **Dado** um celular (375px), **quando** as duas telas abrem, **então** não há rolagem
      horizontal e o essencial (pista, fôlego, ritmo, velocidade) está visível.

## 7. Como verificar

```bash
npm run dev --prefix frontend
```

O backend local aponta para o banco real e treinar/correr gasta o save, então a verificação
usa um mock temporário da API (como na task `13`), apagado no fim.

- Manual: `/HorseSelector/Career/:horseId` e `/Race/:horseId/:trackSlug`, em 1430px e 375px.
- Automático: `npm run build --prefix frontend` e `npm run lint --prefix frontend`.
- Regressão a observar: animação fluida em 4x; atalhos de teclado; modal de resultado.

## 8. Impacto em documentação
- [x] `docs/guia-do-jogador.md` — notas dos atributos e a nova tela de corrida
- [x] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| A escala de notas não bate com a sensação do jogo | médio | Fica numa constante só; o Eduardo ajusta os limiares |
| Treze bolinhas se amontoam na largada | médio | Três faixas por raia e a do jogador por cima |
| Uma volta só engana em pistas longas | baixo | O gramado mostra a distância real e quanto falta |
| Limite do Figma MCP (Starter: 20 leituras/mês) | baixo | O design já foi lido; ajustes finos vêm por captura de tela |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] `npm run build --prefix frontend` passa
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/ui-v2-train-race`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Design v2 das duas telas feito no Figma (UmaTrackGUI) e aprovado pelo Eduardo, que adicionou a sombra dura na arte do treino. Faltaram dois ajustes finos na Race v2 por causa do limite do Figma MCP: o frame *Readings* do HUD com altura *Fill* e o marcador "VOCÊ" em cima da faixa de segmentos. Task criada. |
| 2026-09-27 | Implementada. Notas abaixo. |

**Como foi verificado.** Nunca contra o backend local (banco real). Um mock em memória
(`http` do Node, fora do repositório) serviu `simulateRace`, `generateRivals` e
`resolveTraining` de verdade com os catálogos do seed, e o frontend rodou em `--mode mock`
apontando para ele. As capturas foram tiradas com o Edge headless via DevTools Protocol
(o painel do navegador do app estava minimizado e devolvia imagens cortadas). O Google
Fonts ficou bloqueado nessas capturas, então as fontes aparecem trocadas nelas. Mock,
`.env.mock.local` e a entrada temporária do `launch.json` foram apagados.

| Cenário | Resultado |
|---|---|
| Treino 1430×944 | Layout do Figma; cabe inteiro na tela |
| Treino 375px | Uma coluna, sem rolagem horizontal (`scrollWidth === 375`) |
| Energia 20, 0 turnos | *Start race!* desabilitado com "faltam 15"; Treinar desabilitado; custo vira "risco de falhar"; cartão de turnos diz "descansar sai de graça" |
| Descansar sem turnos | 20 → 65 de energia e o aviso "(sem turnos, o descanso saiu de graça)" |
| Ver skills | Abre e fecha o `SkillPanel` (`aria-expanded`); com a lista aberta a arte fica fixa na tela |
| Corrida Tokyo (14 corredoras) 1430×944 | Cabe inteira; câmera de 1º lugar com as cores da rival; o jogador em 9º aparece fixado sob o top 5 |
| Corrida Kyoto 375px | Oval legível, sem rolagem horizontal |
| Espaço / → / ← | Pausa; 2 → 3 → 4; ← volta a 3; espaço retoma |
| Pular para o resultado | Modal de resultado abre |

`npm run build --prefix frontend` e `eslint` nos arquivos da task limpos.

**Decisões.**
- **Nota de atributo só de exibição**, em `constants/statRank.ts` (escala na seção 4).
  O "/ 1200" do Figma era placeholder e saiu.
- **"Próxima corrida em N turnos" virou "Turnos restantes".** O jogo não agenda corridas;
  o número que existe é o de turnos da temporada.
- **Treinar continua liberado com energia baixa**, como no servidor (que só arrisca falhar
  abaixo de 25); o card avisa *risco de falhar* em vez de bloquear.
- **Uma volta só, qualquer distância.** O motor é linear; o oval é leitura, e o gramado
  mostra os metros reais.
- **Classificação: top 5 + o jogador.** Com 14 corredoras a lista cortava a égua do jogador.
- **Distância em metros, não em corpos**, na classificação e nas câmeras.
- **No celular** o oval esconde o balão e os textos laterais e aumenta bolinhas e
  distância (CSS em unidades do `viewBox`).
- A colocação da **linha do turno** (HUD) é a do começo do turno, e a da pista anda com as
  bolinhas; num pelotão apertado as duas diferem. Registrado no guia, sem mudar o motor.

**Fora do escopo, encontrado no caminho.** `GuideContent`, `HorseCatalog` e
`HorseSelectorSelect` importam `gameIcons/witIcon.png`, mas o arquivo no git é
`WitIcon.png`: funciona no Windows (sistema de arquivos sem distinção de maiúsculas) e
quebra o build no Linux. Esta task usa o nome certo; a correção dos três fica para outra.

# Task 11 — Refazer o frontend da tela de corrida

| Campo | Valor |
|---|---|
| **ID** | `11` |
| **Branch** | `feat/race-ui-redesign` |
| **Base** | `docs/task-template` |
| **Status** | 🔍 Em revisão |
| **Tamanho** | G |
| **Depende de** | `10` |
| **Bloqueia** | `13` |
| **Área** | frontend |
| **Criada em** | 2026-09-23 |

---

## 1. Contexto
A tela de corrida (`RaceRunner`) foi escrita para provar que o replay do motor anima, não
para ser bonita ou legível. Hoje ela é uma pilha de `div`s com CSS próprio: as raias são
barras cinzas com um retângulo colorido correndo por cima, o fôlego é um `<progress>` nativo
com `title="Fôlego"`, o resultado é um modal com uma lista de recompensas e o cabeçalho
mistura nome da pista, relógio e controles de velocidade sem hierarquia. Nada disso conversa
com os tokens que já existem em `App.css` (`--font-tilt`, `--color-*`, `--speed`,
`--stamina`, `--power`, `--wit`), então a corrida parece um jogo diferente do resto do site.

Além do visual, a tela vai receber o HUD de telemetria da task `13`. Colocar mais números
na estrutura atual só piora — o redesign precisa vir antes e já deixar o espaço reservado.

## 2. Objetivo
A tela de corrida passa a ser a melhor tela do jogo: hierarquia visual clara, identidade
consistente com o resto do site e estrutura preparada para receber o HUD de telemetria.

## 3. Escopo

### Dentro do escopo
- [x] **Design system mínimo**: promover os tokens de `App.css` a um arquivo próprio,
      completando o que falta (escala de espaçamento, raios, sombras, escala tipográfica,
      cores de superfície, texto e estado).
- [x] Primitivos compartilhados usados pela corrida: superfície/painel, botão, badge/pill,
      barra de medidor. Cada um nasce aqui porque a corrida precisa, não por especulação.
- [x] Redesenhar `RaceRunner`: cabeçalho, pista e raias, painel de perfil da pista, painel
      de skills, controles de playback.
- [x] Redesenhar a tela de resultado (modal) — colocação, tempo, recompensas, classificação.
- [x] Estados de carregamento e de erro (hoje são um parágrafo solto).
- [x] Responsividade: a tela precisa funcionar em largura de celular.
- [x] Acessibilidade básica: foco visível, contraste, `aria-label` no lugar de `title`.

### Fora do escopo
- Guide, catálogos de Horses e Skills, seleção de pista, treino, perfil. Ficam como estão;
  migram para o design system em tasks futuras, uma por vez.
- Qualquer mudança em `backend/`. Esta task não altera dados, só apresentação.
- Novos números na tela — isso é a task `13`. Aqui só se reserva o lugar deles.

## 4. Abordagem técnica

O design system nasce **do que já existe**, não de uma paleta nova: `App.css` já define as
famílias tipográficas e as cores de atributo usadas no resto do jogo. A task extrai isso
para `frontend/src/styles/`, preenche os buracos (espaçamento, superfícies, estados) e
reescreve o CSS da corrida em cima dos tokens, sem nenhum valor mágico solto.

O componente `RaceRunner` hoje acumula quatro responsabilidades: buscar dados, tocar o
replay, desenhar a pista e mostrar o resultado. A reescrita separa a apresentação em
subcomponentes, mantendo a busca de dados e o `useRacePlayback` onde estão — a lógica de
playback não muda nesta task.

**Layout alvo**

```
+----------------------------------------------+
| cabecalho: pista . distancia . estilo . tempo|
+----------------------------------------------+
| pista com as raias (foco visual)             |
|   > faixa reservada para o HUD (task 13)     |
+-----------------------+----------------------+
| perfil de elevacao    | skills ativando      |
+-----------------------+----------------------+
```

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/styles/tokens.css` | criar | Tokens: cor, espaçamento, raio, sombra, tipografia |
| `frontend/src/App.css` | editar | Importa os tokens; `:root` deixa de acumular tudo |
| `frontend/src/components/ui/Panel/` | criar | Superfície padrão dos painéis |
| `frontend/src/components/ui/Meter/` | criar | Barra de medidor (fôlego hoje, telemetria depois) |
| `frontend/src/components/ui/Pill/` | criar | Badge de fase, terreno, estilo |
| `frontend/src/components/ui/Button/` | criar | Botão pílula: `ink`, `primary`, `ghost` |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Vira composição; sem JSX de layout inline |
| `frontend/src/components/RaceRunner/RaceLane.tsx` | criar | Uma raia: posição, cor, nome, colocação |
| `frontend/src/components/RaceRunner/RaceHeader.tsx` | criar | Cabeçalho + controles de playback |
| `frontend/src/components/RaceRunner/RaceResults.tsx` | criar | Modal de resultado |
| `frontend/src/components/RaceRunner/RaceResults.css` | criar | Estilo do resultado |
| `frontend/src/components/RaceRunner/format.ts` | criar | `formatTime`, `ordinal`, `money` — antes duplicados |
| `frontend/src/components/RaceRunner/RaceRunner.css` | editar | Reescrito sobre os tokens |

**Contratos**

`useRacePlayback` e os tipos de `frontend/src/types/race.ts` **não mudam**. Se durante a
reescrita aparecer vontade de mudar o formato do replay, é sinal de que aquilo pertence à
task `12`.

## 5. Plano de execução
1. [x] Extrair e completar os tokens; aplicar em `App.css` sem quebrar as telas atuais.
2. [x] Criar os primitivos (`Panel`, `Meter`, `Pill`) com o mínimo de props.
3. [x] Quebrar `RaceRunner` em `RaceHeader`, `RaceLane`, `RaceResults` — sem mudar o visual
       ainda, só a estrutura, para o diff visual ficar isolado no passo seguinte.
4. [x] Redesenhar a pista e as raias.
5. [x] Redesenhar painéis de perfil e skills; reservar a faixa do HUD.
6. [x] Redesenhar o modal de resultado e os estados de carregando/erro.
7. [x] Responsividade e passada de acessibilidade.
8. [x] Atualizar `docs/tasks/README.md`.

## 6. Critérios de aceite
- [x] **Dado** o CSS da corrida, **quando** se procura uma cor, espaçamento ou raio,
      **então** todos vêm de tokens — de `tokens.css`, ou dos tokens de componente
      declarados no topo do próprio CSS quando a superfície só existe ali (as raias, o
      véu sobre a arte da pista, a linha de chegada).
- [x] **Dado** um celular (375px), **quando** a corrida roda, **então** todas as raias, o
      relógio e os controles ficam visíveis sem scroll horizontal.
- [x] **Dado** o teclado, **quando** se navega pelos controles de velocidade e pelos botões
      do resultado, **então** o foco é visível e a ordem é a da tela.
- [ ] **Dado** o replay, **quando** a corrida anima, **então** continua correndo na mesma
      velocidade e com os mesmos resultados de antes — nenhuma regressão de comportamento.
      *(Pendente: exige uma corrida real contra o banco; `useRacePlayback` e o fluxo de dados
      não foram tocados, e a animação foi conferida com frames fabricados.)*
- [x] **Dado** o layout, **quando** a task `13` for começar, **então** existe uma área
      definida para o HUD sem precisar mexer no grid de novo.

## 7. Como verificar

```bash
npm run dev --prefix backend
```

```bash
npm run dev --prefix frontend
```

- Manual: logar, escolher uma égua, ir em `/Race/:horseId`, escolher uma pista e correr até o fim.
- Testar nas três velocidades de playback e no botão *Pular*.
- Testar uma pista `incline` (perfil de elevação visível) e uma `flat`.
- Regressão a observar: as outras telas usam `App.css`; conferir Home, Career e catálogos
  depois de mexer no `:root`.

## 8. Impacto em documentação
- [ ] `README.md` — se houver screenshot da corrida, atualizar
- [ ] `docs/guia-do-jogador.md` — se descrever a tela, revisar
- [x] `docs/tasks/README.md`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Mexer no `:root` de `App.css` quebra telas fora do escopo | alto | Só **adicionar** tokens; nenhum token existente é renomeado ou removido nesta task |
| MUI já está no projeto e pode conflitar com os primitivos novos | médio | Os primitivos da corrida são CSS puro; não introduzir MUI nesta tela |
| "Melhor tela do jogo" é subjetivo | médio | Validar o layout com o Eduardo depois do passo 4, antes de polir o resto |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) marcados, menos a regressão de comportamento, que depende do smoke test
- [x] `npm run build --prefix frontend` passa; `npx eslint src` limpo nos arquivos da task
- [x] Sem `console.log` ou CSS morto deixado para trás; o andaime de prévia foi apagado
- [x] Documentação da seção 8 atualizada
- [x] Commit e push em `feat/race-ui-redesign`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Task escrita. |
| 2026-09-23 | Implementada. Notas abaixo. |
| 2026-09-27 | Recebeu o motor por turnos da task `14` (merge de `main`): relógio em "Turno N", tempos em turnos e velocidade em m/turno no `RaceHeader` e no `RaceResults`; `formatTime` saiu de `format.ts`. |

**Identidade visual.** Os tokens foram lidos das telas que já existem — Home, header, cards
de égua — e não inventados: Tilt Warp para títulos e controles, Inder itálico para rótulos,
o corte diagonal do hero (`--clip-hero`) no bloco da pista, a faixa inclinada do card de
égua (`--tilt`) no cabeçalho do resultado, botões pílula pretos como o *Start*.

**Arena escura dentro do site claro.** A camada semântica dos tokens é redefinida por
`.theme-arena`, então `Panel`, `Meter`, `Pill` e `Button` funcionam nos dois contextos sem
saber em qual estão. A corrida é o bloco escuro sobre a página clara, do mesmo jeito que o
hero da Home é.

**Slot do HUD.** Ficou como fluxo de coluna única com `gap`, não como um elemento vazio
reservado: inserir o `RaceHud` entre a pista e os painéis não exige mexer no layout, e não
sobra marcação nem CSS morto esperando a task 13. O lugar está comentado no `RaceRunner.tsx`.

**Tokens de componente.** Superfícies que só existem na pista (raias, listras, véu sobre a
arte, linha de chegada) são declaradas como custom properties no topo de `RaceRunner.css`,
não em `tokens.css` — o global não precisa saber o que é uma raia.

**Como foi verificado.** Uma corrida real gastaria energia e turnos do save, então a tela
foi conferida com um andaime temporário de prévia (dados fabricados, mesmos componentes e
CSS), já apagado: desktop, 375px, foco por teclado, modal de resultado, sem overflow
horizontal e sem erro no console. A Home foi reaberta depois da mudança nos tokens para
confirmar que nada fora da corrida quebrou.

**Fora do escopo, encontrado no caminho.** `TrackCard.tsx` tem um erro de lint pré-existente
(`react-refresh/only-export-components`); não foi tocado.

**Desvio do plano.** Os passos 3 e 4 foram feitos juntos, não em commits separados.

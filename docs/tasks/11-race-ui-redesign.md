# Task 11 — Refazer o frontend da tela de corrida

| Campo | Valor |
|---|---|
| **ID** | `11` |
| **Branch** | `feat/race-ui-redesign` |
| **Base** | `docs/task-template` |
| **Status** | 🔲 Não iniciada |
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
- [ ] **Design system mínimo**: promover os tokens de `App.css` a um arquivo próprio,
      completando o que falta (escala de espaçamento, raios, sombras, escala tipográfica,
      cores de superfície, texto e estado).
- [ ] Primitivos compartilhados usados pela corrida: superfície/painel, botão, badge/pill,
      barra de medidor. Cada um nasce aqui porque a corrida precisa, não por especulação.
- [ ] Redesenhar `RaceRunner`: cabeçalho, pista e raias, painel de perfil da pista, painel
      de skills, controles de playback.
- [ ] Redesenhar a tela de resultado (modal) — colocação, tempo, recompensas, classificação.
- [ ] Estados de carregamento e de erro (hoje são um parágrafo solto).
- [ ] Responsividade: a tela precisa funcionar em largura de celular.
- [ ] Acessibilidade básica: foco visível, contraste, `aria-label` no lugar de `title`.

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
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Vira composição; sem JSX de layout inline |
| `frontend/src/components/RaceRunner/RaceLane.tsx` | criar | Uma raia: posição, cor, nome, colocação |
| `frontend/src/components/RaceRunner/RaceHeader.tsx` | criar | Cabeçalho + controles de playback |
| `frontend/src/components/RaceRunner/RaceResults.tsx` | criar | Modal de resultado |
| `frontend/src/components/RaceRunner/RaceRunner.css` | editar | Reescrito sobre os tokens |

**Contratos**

`useRacePlayback` e os tipos de `frontend/src/types/race.ts` **não mudam**. Se durante a
reescrita aparecer vontade de mudar o formato do replay, é sinal de que aquilo pertence à
task `12`.

## 5. Plano de execução
1. [ ] Extrair e completar os tokens; aplicar em `App.css` sem quebrar as telas atuais.
2. [ ] Criar os primitivos (`Panel`, `Meter`, `Pill`) com o mínimo de props.
3. [ ] Quebrar `RaceRunner` em `RaceHeader`, `RaceLane`, `RaceResults` — sem mudar o visual
       ainda, só a estrutura, para o diff visual ficar isolado no passo seguinte.
4. [ ] Redesenhar a pista e as raias.
5. [ ] Redesenhar painéis de perfil e skills; reservar a faixa do HUD.
6. [ ] Redesenhar o modal de resultado e os estados de carregando/erro.
7. [ ] Responsividade e passada de acessibilidade.
8. [ ] Atualizar `docs/tasks/README.md`.

## 6. Critérios de aceite
- [ ] **Dado** o CSS da corrida, **quando** se procura uma cor, espaçamento ou raio,
      **então** todos vêm de tokens — nenhum hex ou medida solta fora de `tokens.css`.
- [ ] **Dado** um celular (375px), **quando** a corrida roda, **então** todas as raias, o
      relógio e os controles ficam visíveis sem scroll horizontal.
- [ ] **Dado** o teclado, **quando** se navega pelos controles de velocidade e pelos botões
      do resultado, **então** o foco é visível e a ordem é a da tela.
- [ ] **Dado** o replay, **quando** a corrida anima, **então** continua correndo na mesma
      velocidade e com os mesmos resultados de antes — nenhuma regressão de comportamento.
- [ ] **Dado** o layout, **quando** a task `13` for começar, **então** existe uma área
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
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npm run build --prefix frontend` passa
- [ ] Sem `console.log` ou CSS morto deixado para trás
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/race-ui-redesign`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Task escrita. |

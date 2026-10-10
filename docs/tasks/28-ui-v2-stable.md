# Task 28 — Tela v2 do Estábulo (Figma), com animações GSAP

| Campo | Valor |
|---|---|
| **ID** | `28` |
| **Branch** | `feat/ui-v2-stable` (nova: a `feat/ui-v2-rest-track` da 27 já foi para a `main`) |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | M |
| **Depende de** | `27` (hooks de animação GSAP e transição de página) |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-10-10 |

---

## 1. Contexto
A rota `/HorseSelector` (o "Play" da home) ainda era a tela antiga: um painel com GIF e
atributos soltos, uma faixa de miniaturas com cadeado e os botões START e RACES. As
telas da carreira já estão na v2 (tasks 15 e 27). O Figma tem o frame *Desktop - 5 v2
(Estábulo)* (`2227:6`, arquivo UmaTrackGUI) desde 2026-09-28, mas sem task.

## 2. Objetivo
O Estábulo fica igual ao Figma, usa só dados reais do save e anima com GSAP como as
outras telas v2.

## 3. Escopo

### Dentro do escopo
- [x] Card grande da égua escolhida: gradiente na cor dela, marca d'água com o nome,
  selo de estado, arte e cartão com número, nome e chips.
- [x] Cabeçalho com título, contagem de desbloqueadas e saldo.
- [x] Os 4 atributos com nota (G…S), barra até a próxima nota e "próxima nota em X pts".
- [x] Faixa da passiva (nome e efeito, separados pelo `:` do `passiveBuff`).
- [x] Grade *Suas éguas* com filtros Todas / Desbloqueadas / À venda; as à venda têm
  cadeado e preço, e o resto da grade é preenchido com `?` (éguas que ainda vão chegar).
- [x] VOLTAR (menu principal) e o botão principal: COMEÇAR / CONTINUAR / VER CARREIRA,
  COMPRAR · $X ou SALDO INSUFICIENTE.
- [x] Animações: entrada da tela, troca de égua, notas, filtro, hover, compra.

### Fora do escopo
- Redesenhar o modal de compra (`PurchaseModal`): continua o antigo, só confirma.
- Dados que o Figma mostra mas o jogo não tem (apelido "Cinzenta de Kasamatsu",
  distância ideal, tipo de pista, "favorita"). No lugar deles entram dados reais (ver 4).
- O botão RACES da tela antiga: as corridas já se abrem pela tela de carreira.

## 4. Abordagem técnica

- **Qual cópia mostrar.** Uma égua pode ter várias cópias no save (carreiras aposentadas
  ficam como registro). O Estábulo mostra a que está em carreira ou, sem nenhuma, a mais
  recente, a mesma regra do `findOwnedHorse` no backend. Os atributos são os da cópia
  (treinados); para uma égua à venda, os do catálogo.
- **Égua inicial.** A primeira em carreira; senão, a primeira que você tem; senão, a primeira do catálogo.
- **Égua à venda.** Clicar seleciona (prévia com arte acinzentada e selo À VENDA) em vez
  de abrir o modal direto; o botão principal vira COMPRAR e abre o modal.
- **Troca do que não existe no jogo.** Em vez do apelido: "Nº 0X · no seu estábulo / à venda".
  Chips: estilo de corrida, vitórias e fãs (sua) ou preço (à venda). O selo
  "★ FAVORITA" virou estado: ★ PRONTA, ★ EM CARREIRA, APOSENTADA ou À VENDA.
- **Cor.** O gradiente do card sai da `horseColors` (claro → cor → escuro, com `color-mix`).
  A Oguri Cap fica cinza (cor dela no jogo), não azul como no Figma.
- **GSAP** (nada de `@keyframes`/`transition`):
  `useScreenEnter` (card desliza da esquerda, arte sobe, conteúdo em cascata);
  troca de égua → `--hero-color` tweenado, arte e marca d'água deslizam, selo pula;
  `useCountUp`/`useBarTween` nos atributos e no saldo; letra da nota pula ao mudar;
  `useSegmentSlider` no filtro; `useStaggerIn` nos tiles; `useHoverScale` em tiles e botões;
  anel da selecionada com `back.out`; tile recém-comprado sai do cadeado com `elastic`.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/Stable/Stable.tsx` | criar | A tela e o `StableStat`. |
| `frontend/src/components/Stable/Stable.css` | criar | Layout do Figma; cabe numa janela desktop sem rolar (a grade rola). |
| `frontend/src/pages/HorseSelector.tsx` | editar | Renderiza `Stable`. |
| `frontend/src/components/HorseSelectorSelect/*` | remover | Tela antiga. |
| `frontend/src/components/SelectorSelectMiniBox/*` | remover | Miniatura antiga, só usada por ela. |
| `docs/guia-do-jogador.md` | editar | Seção "Começando" descreve o Estábulo. |

## 5. Plano de execução
1. [x] Ler o frame `2227:6` (via ClaudeTalkToFigma, sem gastar cota).
2. [x] Criar `Stable` e trocar a página; remover os componentes antigos.
3. [x] Verificar no navegador com API mockada (desktop 1430×944 e celular 375×812).
4. [x] Atualizar guia e tabela de tasks.

## 6. Critérios de aceite
- [x] **Dado** uma égua em carreira, **quando** abro o Play, **então** ela já vem escolhida, com notas e passiva dela e o botão CONTINUAR CARREIRA!.
- [x] **Dado** uma égua à venda, **quando** clico no tile dela, **então** o card mostra a prévia (À VENDA, arte cinza, preço) e o botão vira COMPRAR · $X, ou SALDO INSUFICIENTE se faltar dinheiro.
- [x] **Quando** confirmo a compra, **então** o saldo desconta contando, o tile sai do cadeado e o botão vira COMEÇAR CARREIRA!.
- [x] Os filtros mostram só as desbloqueadas / só as à venda, sem os `?`.
- [x] Numa janela 1430×944 a tela inteira cabe sem rolar; no celular não há rolagem horizontal.
- [x] Com "reduzir movimento" ligado, nada anima (todos os hooks respeitam `usePrefersReducedMotion`).

## 7. Como verificar
- Manual: `npm run dev --prefix frontend`, logar e clicar em **Play** (rota `/HorseSelector`).
  Comprar mexe no save: para não tocar no banco real, usar a API mockada (XHR falso).
- Automático: `npm run build --prefix frontend` e `npx eslint src/components/Stable`.

## 8. Impacto em documentação
- [x] `docs/guia-do-jogador.md`
- [x] `docs/tasks/README.md` (linha da tabela + status)
- N/A — `README.md`, `race-system-design.md` e OpenAPI: nenhuma regra ou rota mudou.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Oguri Cap cinza em vez do azul do Figma | baixo | Eduardo: trocar a cor dela em `horseColors` muda também a tela de treino. |
| Só 5 éguas no catálogo; os `?` completam 24 vagas | baixo | Some sozinho conforme o catálogo cresce. |
| Modal de compra ainda no visual antigo | baixo | Task futura, se quiser. |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] Build passa: `npm run build --prefix frontend`
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Revisão do Eduardo e merge

---

## Registro de execução
| Data | Nota |
|---|---|
| 2026-10-10 | Feita e verificada com API mockada: troca de égua, filtro, compra, desktop e celular. |
| 2026-10-10 | Tela cabe numa janela sem rolagem (grade mede o espaço que sobra). Mergeada na `main`. |

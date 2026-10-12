# Task 29 — Páginas v2 de Elenco, Skills e Guia (Figma), com animações GSAP

| Campo | Valor |
|---|---|
| **ID** | `29` |
| **Branch** | `feat/ui-v2-catalogs` (nova: a `feat/ui-v2-stable` da 28 já foi para a `main`) |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | M |
| **Depende de** | `27` (hooks de animação GSAP e transição de página) |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-10-12 |

---

## 1. Contexto
As páginas públicas do menu (Horses, Skills e Guide) ainda eram as primeiras versões:
listas simples, um `<select>` para ordenar e botões de filtro soltos. As telas da carreira
e o Estábulo já estão na v2 (tasks 27 e 28). Em 2026-10-12 as três páginas ganharam frames
no Figma UmaTrackGUI: *HorsesScreen v2 (Elenco)* `2281:4`, *SkillsCatalog v2* `2281:228`
e *GuideScreen v2* `2281:583`.

## 2. Objetivo
As três páginas ficam iguais ao Figma, com os dados reais da API, e animam só com GSAP,
como as outras telas v2.

## 3. Escopo

### Dentro do escopo
- [x] **Elenco** (`/Horses`): cartão por égua com arte (`Selection.png`), selo Nº na cor
  dela, tipo (atributo mais alto), passiva, 4 atributos com barra e preço. A ordenação
  (Preço / Speed / Stamina / Power / Wit) vira um seletor segmentado.
- [x] **Skills** (`/Skills`): cartão por skill com faixa e chip de raridade, ícone, custo
  em SP, descrição, efeito e gatilho. Filtro de raridade com contagem, cartão de dica
  sobre SP no fim da grade.
- [x] **Guia** (`/Guide`): ciclo de 5 passos, os 4 atributos, treino (texto + destaques),
  estratégias com a posição no pelotão e o aviso de que ainda não valem, e as pistas com
  perfil de elevação e mínimos recomendados.
- [x] Peças compartilhadas pelas três páginas: cabeçalho, seletor segmentado e cartão.
- [x] Animações GSAP: entrada da página, reordenação, barras, filtro, cascata, hover e
  revelação ao rolar.

### Fora do escopo
- A barra de navegação do Figma (logo UmaSprint, Login verde): o `HeaderTop` aparece no
  site inteiro e continua o atual. Vira outra task, se quiser.
- Os dados do banco local (passivas de teste, preços iguais): as páginas mostram o que a
  API devolve; o catálogo certo está em `backend/src/data/`.

## 4. Abordagem técnica

- **Peças comuns** em `components/CatalogPage/`: `CatalogPage.css` (fundo, cabeçalho com
  eyebrow, título e texto, cartão branco) e `Segmented` (opções iguais e um "polegar"
  branco que o `useSegmentSlider` desliza).
- **Nº da égua** é a posição dela no catálogo, não na ordenação: não muda ao reordenar.
- **Arte** usa `Selection.png`, que todas as éguas do catálogo têm (a Nice Nature não tem
  `<Nome>1.png`, que a página antiga usava).
- **Ícones de skill** saíram da `SkillsScreen` para `constants/skillIcons.ts`; a tela de
  carreira e o catálogo usam o mesmo mapa.
- **GSAP** (nada de `@keyframes`/`transition`):
  `useScreenEnter` na entrada (cabeçalho em cascata e libera a cortina da transição);
  reordenar o Elenco → `useFlipReorder` (novo, plugin Flip: os cartões deslizam até o
  novo lugar); `useBarTween` enche as barras a partir de zero, em cascata por cartão;
  `useStaggerIn` nos cartões a cada filtro; `useHoverScale` nos cartões;
  no Guia, `useScrollReveal` (novo, ScrollTrigger) faz cada bloco subir ao entrar na
  tela e os perfis das pistas se desenharem da esquerda para a direita (`clip-path`).
  Todos respeitam `usePrefersReducedMotion`.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/CatalogPage/CatalogPage.css` | criar | Estilo comum das três páginas. |
| `frontend/src/components/CatalogPage/Segmented.tsx` | criar | Seletor segmentado com polegar deslizante. |
| `frontend/src/components/HorseCatalog/*` | editar | Elenco do Figma; `StatRow` com barra animada. |
| `frontend/src/components/SkillCatalog/*` | editar | Catálogo de skills do Figma. |
| `frontend/src/components/GuideContent/*` | editar | Guia do Figma. |
| `frontend/src/animations/useFlipReorder.ts` | criar | Reordenação com GSAP Flip. |
| `frontend/src/animations/useScrollReveal.ts` | criar | Revelação ao rolar com ScrollTrigger. |
| `frontend/src/constants/skillIcons.ts` | criar | Mapa efeito → ícone, antes dentro da `SkillsScreen`. |
| `frontend/src/components/SkillsScreen/SkillsScreen.tsx` | editar | Usa `skillIcon` do novo arquivo. |

## 5. Plano de execução
1. [x] Desenhar as três telas no Figma (via ClaudeTalkToFigma, sem gastar cota).
2. [x] Criar as peças comuns e os dois hooks novos.
3. [x] Reescrever Elenco, Skills e Guia.
4. [x] Verificar no navegador (1440×950) com o backend local, só leituras.
5. [x] Registrar a task.

## 6. Critérios de aceite
- [x] **Quando** abro `/Horses`, **então** vejo um cartão por égua com arte, tipo, passiva, atributos e preço, e as barras enchem.
- [x] **Quando** escolho outra ordenação, **então** os cartões deslizam até a nova ordem (ex.: Power → Oguri, Grass Wonder, Special Week, Suzuka, Nice Nature no banco local) e o Nº de cada uma não muda.
- [x] **Quando** filtro `/Skills` por "Única", **então** ficam só as skills únicas e o cartão de dica, e o polegar do seletor desliza até a opção.
- [x] **Quando** rolo `/Guide`, **então** cada bloco aparece ao entrar na tela e os perfis das pistas se desenham.
- [x] Com "reduzir movimento" ligado, nada anima.

## 7. Como verificar
```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

- Manual: abrir **Horses**, **Skills** e **Guide** no menu. As rotas só leem
  (`/horses`, skills, pistas), então usar o banco real não mexe no save.
- Automático: `npm run build --prefix frontend` e `npx eslint` nos arquivos da tabela.
- Regressão a observar: a `SkillsScreen` da carreira continua com os mesmos ícones.

## 8. Impacto em documentação
- [x] `docs/tasks/README.md` (linha da tabela + status)
- N/A — `README.md`, `race-system-design.md`, `guia-do-jogador.md` e OpenAPI: nenhuma
  regra, rota ou fluxo de jogo mudou, e o guia do jogador não descreve essas páginas.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| A revelação ao rolar do Guia só foi vista no painel de navegador do Claude com `ScrollTrigger.update()` manual (o painel não roda `requestAnimationFrame`) | médio | Eduardo: rolar o Guia uma vez num navegador comum. |
| Barra de navegação do Figma não implementada | baixo | Task futura, se quiser trocar o `HeaderTop` do site todo. |
| `witIcon.png` é importado em minúsculas, mas o arquivo é `WitIcon.png` (já era assim) | baixo | Funciona no Windows; quebraria num build em Linux. |

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
| 2026-10-12 | Frames feitos no Figma (`2281:4`, `2281:228`, `2281:583`) e páginas implementadas. |
| 2026-10-12 | Verificado a 1440×950 com o backend local: Flip na ordenação, filtro, entrada e revelação (esta com update manual). |
| 2026-10-12 | Mergeada na `main`. |

# Task 30 — Barra de navegação v2 (Figma), com a marca UmaTrack

| Campo | Valor |
|---|---|
| **ID** | `30` |
| **Branch** | `feat/ui-v2-header` (nova: a `feat/ui-v2-catalogs` da 29 já foi para a `main`) |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | P |
| **Depende de** | `29` (frames do Figma com a barra) |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-10-14 |

---

## 1. Contexto
A task 29 trouxe Elenco, Skills e Guia para a v2, mas deixou de fora a barra de
navegação dos frames do Figma: o `HeaderTop` ainda era o antigo (logo de cavalo, fonte
Tilt Warp, Login em gradiente magenta, sublinhado preto fixo).

## 2. Objetivo
A barra do site fica igual à dos frames v2, com a marca **UmaTrack**, e o sublinhado da
página atual se move com GSAP.

## 3. Escopo

### Dentro do escopo
- [x] Marca "Uma" + "Track" em verde (o Figma dizia "UmaSprint"; o nome passou a ser
  UmaTrack, como no repositório e no hero da Home).
- [x] Links Home / Horses / Skills / Guide / Play no centro; o atual fica escuro.
- [x] Canto da conta: Login em pílula verde, ou avatar com a inicial, nome (vai ao perfil)
  e Logout contornado.
- [x] Sublinhado verde animado com GSAP; hover com `useHoverScale` na marca e nos botões.
- [x] Celular: links numa segunda linha, sem rolagem horizontal.
- [x] Marca trocada para UmaTrack também nas barras dos três frames do Figma.

### Fora do escopo
- A cortina de transição do `CustomLink`: continua a mesma.
- Trocar "UmaSprint" no resto do projeto (pasta, README, títulos): só a barra mudou.

## 4. Abordagem técnica
- **Um sublinhado só**, desenhado com 100px na borda esquerda do `<nav>`; o GSAP põe `x`
  e `scaleX` para casar com o link (só transform/opacity). Vai ao link sob o ponteiro e
  volta ao atual quando o ponteiro sai; some nas páginas sem link (Login, perfil).
- **Entre páginas.** Cada página monta o próprio header, então a última posição fica numa
  variável do módulo. A página nova começa o sublinhado nela e desliza até o seu link.
  A posição de partida é lida uma vez por montagem (`useRef`), para o StrictMode do dev,
  que roda o efeito duas vezes, não começar já no destino.
- **Link atual** é calculado à mão (`isActive`), porque a classe `active` do `NavLink`
  de "/" valeria em todas as rotas.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/headerTop/headerTop.tsx` | editar | Marca, links, conta e sublinhado com GSAP. |
| `frontend/src/components/headerTop/headerTop.css` | editar | Visual do Figma e layout de celular. |

Figma UmaTrackGUI: o texto da marca nas barras `2281:5`, `2281:229` e `2281:584` virou
os nós `2299:4`, `2299:6` e `2299:8` ("Uma" + "Track" em verde).

## 5. Plano de execução
1. [x] Refazer `HeaderTop` e o CSS.
2. [x] Verificar no navegador (1440×900 e 375×812).
3. [x] Trocar a marca nos frames do Figma.
4. [x] Registrar a task.

## 6. Critérios de aceite
- [x] **Quando** abro qualquer página, **então** a barra mostra UmaTrack, os 5 links e Login (ou a conta).
- [x] **Quando** passo o mouse num link, **então** o sublinhado desliza até ele, e volta ao atual quando saio.
- [x] **Quando** troco de página pelo menu, **então** o sublinhado sai do link anterior e desliza até o novo (Guide → Home: 270 → 101 → 27 → 0 px).
- [x] No celular (375px) os links ficam numa segunda linha e a página não rola para os lados.

## 7. Como verificar
- Manual: `npm run dev --prefix frontend` e navegar pelo menu; logar para ver a conta.
- Automático: `npm run build --prefix frontend` e `npx eslint src/components/headerTop`.

## 8. Impacto em documentação
- [x] `docs/tasks/README.md` (linha da tabela + status)
- N/A — `README.md`, `race-system-design.md`, `guia-do-jogador.md` e OpenAPI: nada de jogo
  ou rota mudou.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| O estado logado (avatar, nome, Logout) não foi visto no navegador | baixo | Eduardo: logar uma vez e conferir. |
| O projeto ainda se chama UmaSprint em outros lugares | baixo | Eduardo decide se renomeia o resto. |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] Build passa: `npm run build --prefix frontend`
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Merge na `main`

---

## Registro de execução
| Data | Nota |
|---|---|
| 2026-10-12 | Header feito; nome trocado para UmaTrack a pedido do Eduardo. Verificado a 1440×900 e 375×812. |
| 2026-10-14 | Marca trocada nos frames do Figma; mergeada na `main`. |

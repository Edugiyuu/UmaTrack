# Task 27 — Telas v2 de descanso, escolha de pista e skills, com animações GSAP (Figma)

| Campo | Valor |
|---|---|
| **ID** | `27` |
| **Branch** | `feat/ui-v2-rest-track` (nova: a `15` já foi para a `main`) |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | G |
| **Depende de** | `15` (tokens e layout v2), `17` (turnos e próxima corrida da carreira) |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-10-01 |

---

## 1. Contexto
A `15` levou o treino e a corrida para o design v2. Faltaram duas telas que o Eduardo
desenhou depois no Figma (UmaTrackGUI):

- **Descanso.** Hoje, apertar *Descansar* só mostra um aviso ("Ela descansou: +N de
  energia"). Não existe tela.
- **Escolha de pista.** A `RaceTrackSelect` ainda tem o layout antigo, com a coluna de
  atributos e sem a arte da égua.
- **Skills.** Hoje é só um botão *Ver skills* que abre/fecha uma lista (`SkillPanel`)
  embaixo do treino, sem a arte e fora do design v2.

Nas três telas v2, a égua aparece grande, animada, do lado esquerdo: bocejando no
descanso, correndo na escolha de pista e apontando o dedo nas skills. Os três GIFs da
Nice Nature já foram gravados no UmaViewer e estão no repositório.

## 2. Objetivo
Descansar abre a tela v2 de descanso, a escolha de pista segue o design v2 e o botão
*Skills* abre a loja de skills v2. As três mostram a égua animada (a Nice Nature com os
GIFs novos; as outras com o fallback). A passagem entre as telas da carreira é uma
transição suave, e os números da GUI (energia, SP, atributos) mudam animados, não de
repente. Tudo animado com **GSAP**.

## 3. Escopo

### Dentro do escopo

**Design no Figma**
- Descanso: frame **RestScreen v2** — <https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2249-1536>
- Escolha de pista: frame **ChooseTrackScreen v2** — <https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2250-1569>
- Skills: frame **SkillsScreen v2** (`2263:84`), feito a partir do rascunho *SkillsScreen v1*
  (`2263:7`) do Eduardo — <https://www.figma.com/design/vuv4DgtpS3pbqFwmlRt09V/UmaTrackGUI?node-id=2263-84>

**Ajustes de 2026-10-01 no Figma**
- **Céu estrelado no descanso.** A RestScreen v2 ganhou a camada *Night sky* (`2265:342`)
  atrás de tudo: ~110 pontinhos (branco-lilás `#EDE3FF` e amarelo-claro `#FFE9A8`, raio
  0,8–3,2 px, opacidade 0,35–0,95) e 12 brilhos de 4 pontas. Fundo continua sólido
  `#3a0b60`, **sem glow** (o brilho da lua e a névoa roxa foram testados e removidos).
- **Nome vertical padronizado.** Vale para as quatro telas v2 com a égua à esquerda:
  Inter Black 87, espaçamento 20%, centralizado, branco, sem contorno nem sombra, girado
  para ler de baixo para cima, na posição local (18, 857) do frame, **logo abaixo da arte
  da égua** na ordem das camadas (ela passa por cima de parte das letras).

  | Tela | Nó do nome |
  |---|---|
  | RestScreen v2 | `2265:341` (o ajustado pelo Eduardo; é a referência) |
  | SkillsScreen v2 | `2265:465` (substituiu o antigo Inter Bold 96) |
  | ChooseTrackScreen v2 | `2265:466` (substituiu o antigo) |
  | TrainScreen v2 (`2221:4`, da `15`) | `2265:467` (novo; antes só tinha o nome no cabeçalho) |

  Testado e rejeitado: Anton com contorno e sombra dura, e o nome por cima da égua.

**Assets (já no repositório)**

| Arquivo | Tela | Animação | Resolução | Frames | Peso |
|---|---|---|---|---|---|
| `frontend/public/horses/NiceNature/Rest1.gif` | Descanso | Ela bocejando, com sono | 1000×1000 | 43 (1,29 s) | 6,1 MB |
| `frontend/public/horses/NiceNature/Run1.gif` | Escolha de pista | Pose de corrida, **toca uma vez e para** (sem o bloco de loop) | 1200×1200 | 25 (0,75 s) | 3,1 MB |
| `frontend/public/horses/NiceNature/Skills1.gif` | Skills | Apontando o dedo pra cima, sorrindo de olhos fechados | 1000×1000 | 45 (1,35 s) | 6,1 MB |
| `frontend/src/assets/skillIcons/{speed,stamina,start}.png` | Skills | Ícones dos cartões (exportados do Figma) | ~190×190 | — | ~35 KB cada |

Os três vieram de `D:\UmaViewer\build\StandaloneWindows64\Screenshots` e são os mesmos
que estão nos frames do Figma (conferido por hash):

| GIF no repositório | Original do UmaViewer | Frame do Figma |
|---|---|---|
| `Rest1.gif` | `UmaViewer_2026-10-01_00-10-23-754.gif` | RestScreen v2 (`2249:1536`) |
| `Run1.gif` | `UmaViewer_2026-09-30_23-50-17-376.gif` | ChooseTrackScreen v2 (`2250:1569`) |
| `Skills1.gif` | `UmaViewer_2026-09-30_23-57-31-710.gif` | SkillsScreen v1 (`2263:7`) e v2 (`2263:84`) |

O `Run1.gif` do repositório não bate mais por hash com o do Figma: tirei o bloco de loop
(NETSCAPE2.0) para ele tocar uma vez e parar no último quadro, a pedido do Eduardo.

Estão dentro do limite de 10 MB por GIF combinado com o Eduardo. `Rest1.gif` e
`Skills1.gif` têm o mesmo peso (6.397.952 bytes) por coincidência do UmaViewer; são
animações diferentes.

**Descanso (RestScreen v2)**
- [x] Fundo roxo noturno (`#3a0b60`) com as estrelinhas, GIF da égua grande à esquerda,
      nome vertical no padrão novo e o "Z z z.." sobre ela.
- [x] Eyebrow "CARREIRA · DESCANSO", título "Well rested!" e o subtítulo.
- [x] Cartão de energia: antes → depois, chip com o ganho (`+N`) e a barra.
- [x] Dois blocos: **Turno** (gastou ou não, "sem turnos, saiu de graça") e **Próxima
      corrida** (pista e turnos que faltam, da `17`).
- [x] Botão **CONTINUAR · voltar ao treino**.

**Escolha de pista (ChooseTrackScreen v2)**
- [x] GIF da égua correndo à esquerda, ocupando a altura da tela, com o nome vertical.
- [x] Eyebrow "CARREIRA · CORRIDA", título "Escolha a pista" e a linha de contexto
      ("Prova avulsa: gasta 1 turno e 35 de energia. Próxima prova da carreira: …").
- [x] Grade 3×2 de cartões de pista: thumb, chip de pronta/falta requisito, chip de
      dificuldade, nome, meta (distância · categoria · superfície), prêmio e inscrição.
      Cartão selecionado com borda verde e fundo `#f2fcf0`.
- [x] Estratégia em controle segmentado (Fugitiva · Ponta · Perseguidora · Fechadora) com
      a dica embaixo.
- [x] Botões **VOLTAR · ao treino** e **START RACE!** com o resumo (pista · energia ·
      inscrição). Os bloqueios de hoje (energia, dinheiro, requisito, aposentada) continuam.

**Skills (SkillsScreen v2)**
- [x] Tela cheia por cima do treino, no lugar do `SkillPanel`: GIF da égua apontando à
      esquerda sobre a cunha na cor dela, nome vertical e o canto inferior direito na cor dela.
- [x] Eyebrow "CARREIRA · SKILLS", título "Learn skills!", subtítulo e carteira com os SP.
- [x] Filtro segmentado **Todas · Posso aprender · Aprendidas**, com a contagem de cada um.
- [x] Grade de cartões (2 colunas; rola só a grade): ícone, nome, chip de raridade (faixa
      lateral azul/dourada/roxa), chip de custo, efeito, quando dispara e a chance.
      Estados: **Aprender**, **✓ Aprendida** (fundo verde) e **Faltam N SP** (desabilitado).
- [x] Botão **CONTINUAR · voltar ao treino** (Esc também fecha).

**Botão de corrida da TrainScreen: "START RACE!" → "ESCOLHER PISTA"**

No treino, o botão grande não começa corrida nenhuma: ele leva para a escolha de pista. O
*START RACE!* de verdade fica na ChooseTrackScreen. Dois botões com o mesmo nome em telas
seguidas confundem, então:

- [x] TrainScreen (código e Figma *TrainScreen v2* `2221:4`): o botão vira
      **ESCOLHER PISTA** com a linha de baixo "prova avulsa · −35 energia · 1 turno". No dia
      da prova da carreira (`raceDue`), vira **IR PARA A PROVA** com "{pista} · sem
      inscrição · −35 energia". Os bloqueios de hoje (energia, aposentada) continuam.
- [x] *START RACE!* fica só na ChooseTrackScreen, onde a largada acontece.
- [x] No Figma da TrainScreen v2, "VER SKILLS" vira **SKILLS** (como já está no código).
- [x] Figma: botão da TrainScreen v2 trocado para **ESCOLHER PISTA** (`2221:123`) e variante
      **IR PARA A PROVA** logo abaixo do frame (`2266:468`), com uma nota (`2266:471`). Falta o código.
- Texto em português, como o resto dos botões do treino ("Treinar", "Descansar"); se o
  Eduardo preferir em inglês, "PICK TRACK".

**Animações (GSAP)**

Regra: **toda animação desta task é feita com GSAP** (`gsap` 3.13, que já é dependência e
já anima a corrida e a home), não com `@keyframes`/`transition` de CSS. O CSS só define os
estados (início e fim); quem move é o GSAP.

*Transição entre telas (rotas)*
- [x] Treino → escolha de pista (*ESCOLHER PISTA*), escolha de pista → treino
      (*VOLTAR*), escolha de pista → corrida (*START RACE!*) e fim da corrida → treino:
      uma cortina na cor da égua varre a tela (a mesma diagonal da cunha das telas v2),
      a rota troca por baixo dela e a cortina sai revelando a tela nova. ~0,6 s no total.
- [x] Ao entrar, a tela monta em sequência: cunha desliza da esquerda, a égua sobe do
      rodapé com um leve fade, e o conteúdo da direita entra em cascata (stagger de
      eyebrow → título → blocos → botões).
- [x] Voltar do navegador (sem clique) só toca a entrada da tela, sem cortina.

*Telas por cima do treino (descanso e skills)*
- [x] Abrir: a mesma montagem em sequência (cunha, égua, conteúdo em cascata).
- [x] Fechar (*CONTINUAR* / Esc): a montagem ao contrário e só então desmonta; o treino
      por baixo já aparece com os valores novos animando.

*GUI*
- [x] **Descanso:** a barra de energia **enche suave** do valor de antes até o de depois
      (~0,9 s, `power2.out`), o número conta junto (30 → 75), o chip `+45` entra com um
      pop (`back.out`) quando a barra termina, e o "Z z z" flutua em loop leve.
- [x] **Treino:** depois de treinar ou descansar, a barra de energia, o valor do atributo,
      a barra de progresso da nota e o *Skill pts* animam até o valor novo; quando a nota
      sobe (C → C+), a letra dá um pop.
- [x] **Skills:** cartões entram em cascata ao abrir e ao trocar o filtro; o fundo branco
      do segmento ativo **desliza** até o filtro clicado; ao aprender, a carteira de SP conta
      para baixo e o cartão passa para "✓ Aprendida" com um flash verde.
- [x] **Escolha de pista:** cartões em cascata ao entrar; o cartão selecionado cresce um
      pouco e a borda verde aparece com tween; o resumo do *START RACE!* troca com um
      fade curto; o fundo do segmento de estratégia desliza como no das skills.
- [x] Botões e cartões: hover/press com um `scale` curto via GSAP.

*Regras de implementação*
- [x] **Acessibilidade:** com `prefers-reduced-motion`, tudo vai direto ao estado final
      (`usePrefersReducedMotion`, como no `RaceHud`); a cortina vira um corte seco.
- [x] **Limpeza:** cada animação mora num `useLayoutEffect` com `gsap.context()` (ou
      `tween.revert()`) e é desfeita no unmount, como em `RaceHud`/`RaceBanner`. Nada de
      tween órfão mexendo em nó desmontado.
- [x] **Desempenho:** animar só `transform` e `opacity`. As barras usam `scaleX` com
      `transform-origin: left`, não `width`.
- [x] **Não bloquear:** clique durante uma transição não dispara duas navegações; a
      cortina não passa de ~0,6 s.
- [x] Os efeitos CSS que já existem nas telas desta task (o `@keyframes SkillsScreen-in`
      e os `transition` de hover do `SkillsScreen`) migram para GSAP.

### Fora do escopo
- **GIFs das outras éguas.** Só a Nice Nature tem `Rest1`/`Run1`/`Skills1`. As outras usam o
  fallback (`Profile1.gif` → PNG). Gravar as delas vira task própria quando o Eduardo tiver
  as capturas.
- **Converter os GIFs para WebP/WebM.** Só se o jogo for hospedado; hoje roda local.
- Mudar regra de descanso ou de inscrição: só visual.
- Animar telas fora da carreira (home, perfil, estábulo, login) e trocar as animações
  da corrida, que já são GSAP (`RaceRunner`).
- Som nas transições (fica com a `24`).

## 4. Abordagem técnica

**Arte.** Os nomes seguem o padrão da pasta (`Profile1`, `Train1`, `Walking1`). As telas
usam o helper que já existe, que cai para `Profile1.gif` e depois para o PNG:

```ts
horseAnimation(horse.name, "Rest1.gif")   // descanso
horseAnimation(horse.name, "Run1.gif")    // escolha de pista
horseAnimation(horse.name, "Skills1.gif") // skills
```

**Descanso como tela, não rota.** O `restHorse` já devolve tudo o que a tela precisa
(`energyRecovered`, `energy`, `turnSpent`). O `CareerMenu` guarda a resposta e a energia
de antes, e mostra o `RestScreen` por cima, em tela cheia. *CONTINUAR* fecha e volta ao
treino já atualizado. Sem rota nova, sem chamada nova à API, e o voltar do navegador não
cai num descanso sem dados.

**Skills como tela, não rota.** Mesmo esquema do descanso: o `CareerMenu` abre o
`SkillsScreen` em tela cheia; aprender atualiza a égua pelo `onHorseUpdated` e *CONTINUAR*
volta ao treino. O `SkillPanel` sai. Os textos de efeito e gatilho foram para
`constants/skillText.ts`, usados também pelo catálogo (`/Skills`); no cartão o efeito usa
`brief` (omite o "por 1 turno", que é o padrão). Ícone por tipo de efeito: largada →
portão, fôlego/atributo → brilho, o resto → corredora.

**Transição entre rotas.** O React Router não anima troca de rota; a task cria:
- `PageTransition` (montado uma vez, em volta das rotas em `AppRoutes`): uma `div` fixa,
  na cor da égua, com o `clip-path` da cunha, escondida fora da tela.
- `useTransitionNavigate()`: no clique, uma timeline GSAP traz a cortina, chama o
  `navigate()` do React Router quando ela cobre a tela e devolve; a tela nova, ao montar,
  pede `reveal()` e a cortina sai. Se a tela nova demorar a carregar (fetch), a cortina
  espera o `reveal()` (com um teto, para não prender a tela).
- Sem a cortina quando a navegação vem do voltar/avançar do navegador (`POP`).

**Animações da GUI.** Hooks pequenos e reaproveitáveis em `frontend/src/animations/`:
- `useCountUp(value)`: anima um número do valor anterior ao novo (`gsap.to` num objeto,
  `onUpdate` escrevendo no nó; o React só guarda o valor final).
- `useBarTween(ratio)`: `scaleX` de uma barra do valor anterior ao novo.
- `useStaggerIn(ref, selector, deps)`: cascata de entrada.
- `useSegmentSlider(ref, activeIndex)`: o fundo do segmento ativo desliza.
- `useScreenEnter(ref)` / `screenExit(ref)`: a montagem (cunha, égua, conteúdo) e a
  desmontagem das telas v2, usadas pelas rotas e pelas telas por cima do treino.
Todos respeitam `usePrefersReducedMotion`. GSAP já está no projeto; não precisa do
`@gsap/react` (o padrão do repositório é `useLayoutEffect` + `gsap.context`).

**Escolha de pista.** Reescrever o layout da `RaceTrackSelect` e do `TrackCard` em cima
dos tokens da `15`, mantendo a lógica de seleção, requisitos e bloqueios como está.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/public/horses/NiceNature/Rest1.gif` | criar | ✅ GIF do descanso |
| `frontend/public/horses/NiceNature/Run1.gif` | criar | ✅ GIF da escolha de pista |
| `frontend/src/components/RestScreen/RestScreen.tsx` / `.css` | criar | ✅ Tela v2 de descanso |
| `frontend/src/components/CareerMenu/CareerMenu.tsx` | editar | ✅ Guarda o resultado do descanso e abre o `RestScreen` no lugar do aviso |
| `frontend/src/components/RaceTrackSelect/RaceTrackSelect.tsx` / `.css` | editar / reescrever | ✅ Layout v2, GIF à esquerda, estratégia segmentada |
| `frontend/src/components/TrackCard/TrackCard.tsx` / `.css` | editar | ✅ Cartão v2 com os chips |
| `frontend/public/horses/NiceNature/Skills1.gif` | criar | ✅ GIF das skills |
| `frontend/src/assets/skillIcons/*.png` | criar | ✅ Ícones dos cartões de skill |
| `frontend/src/components/SkillsScreen/SkillsScreen.tsx` / `.css` | criar | ✅ Loja de skills v2 |
| `frontend/src/components/SkillPanel/` | remover | ✅ Substituído pelo `SkillsScreen` |
| `frontend/src/constants/skillText.ts` | criar | ✅ Raridade, efeito e gatilho em texto (catálogo + loja) |
| `frontend/src/components/SkillCatalog/SkillCatalog.tsx` | editar | ✅ Usa o `skillText` |
| `frontend/src/animations/` | criar | ✅ Hooks GSAP: `useCountUp`, `useBarTween`, `useStaggerIn`, `useSegmentSlider`, `useScreenEnter` |
| `frontend/src/components/PageTransition/` | criar | ✅ Cortina entre rotas + `useTransitionNavigate` |
| `frontend/src/routes/AppRoutes.tsx` | editar | ✅ Envolve as rotas com o `PageTransition` |
| `frontend/src/components/CareerMenu/CareerMenu.tsx` / `.css` | editar | ✅ Botão **ESCOLHER PISTA** / **IR PARA A PROVA**; barras e números animados; navegação com transição |
| `frontend/src/components/SkillsScreen/SkillsScreen.tsx` / `.css` | editar | ✅ Entrada/saída, cascata, segmento deslizante, SP contando; sai o `@keyframes`/`transition` de CSS |
| `frontend/src/components/RaceRunner/` (só a saída) | editar | ✅ Volta ao treino com a transição; levanta a cortina quando a corrida chega |
| `frontend/src/components/CareerMenu/StatCard.tsx` | criar | ✅ Cartão de atributo saiu do `CareerMenu` para animar valor, barra e nota |
| `frontend/src/components/ui/VerticalName/` | criar | ✅ Nome vertical padronizado (Inter Black) das quatro telas v2 |
| `frontend/src/hooks/useFreshGif.ts` | criar | ✅ O `Run1.gif` toca de novo a cada visita (URL de blob nova por montagem) |
| `frontend/src/assets/rest/` | criar | ✅ Céu estrelado e lua (SVG exportados do Figma) e o ícone da pista |
| `frontend/index.html`, `styles/tokens.css` | editar | ✅ Fonte Inter 900 e o token `--font-name` |

**Contratos**

```ts
// frontend/src/components/RestScreen/RestScreen.tsx
interface RestScreenProps {
  horse: HorseResponseProfile;  // já atualizado
  energyBefore: number;
  rest: { energyRecovered: number; energy: number; turnSpent: boolean };
  onContinue: () => void;
}
```

## 5. Plano de execução
1. [x] Copiar os GIFs da Nice Nature para `frontend/public/horses/NiceNature/`.
   - [x] `SkillsScreen` v2 (Figma + código) no lugar do `SkillPanel`.
2. [x] `RestScreen` + ligação no `CareerMenu`.
3. [x] `TrackCard` v2.
4. [x] `RaceTrackSelect` v2.
5. [x] Botão **ESCOLHER PISTA** / **IR PARA A PROVA** no treino (código + Figma).
6. [x] Hooks de animação (`frontend/src/animations/`) e `PageTransition`.
7. [x] Ligar as animações: transição de rotas, entrada/saída das telas por cima do treino,
       energia do descanso, números do treino, skills e escolha de pista.
8. [x] Conferir as telas com outra égua (fallback), em 1366×768 e com reduced motion.
9. [x] Atualizar a documentação (seção 8).

## 6. Critérios de aceite
- [x] **Dado** a Nice Nature com energia abaixo de 100, **quando** aperto *Descansar*,
      **então** abre a tela de descanso com ela bocejando, a energia antes → depois e o ganho.
- [x] **Dado** a carreira sem turnos, **então** o bloco Turno diz que o descanso saiu de graça.
- [x] **Dado** a tela de descanso, **quando** aperto *CONTINUAR*, **então** volto ao treino
      com a energia nova.
- [x] **Dado** a Nice Nature, **quando** abro a escolha de pista, **então** ela aparece
      correndo à esquerda.
- [x] **Dado** outra égua (ex.: Oguri Cap), **então** as duas telas mostram o
      `Profile1.gif` dela, sem imagem quebrada.
- [x] **Dado** uma pista bloqueada (energia, dinheiro ou requisito), **então** *START RACE!*
      continua desabilitado com o motivo, como hoje.
- [x] **Dado** a tela de treino, **quando** aperto *Skills*, **então** abre a loja v2 com os
      SP dela; *Aprender* só fica ativo com SP suficiente, a aprendida mostra "✓ Aprendida" e
      *CONTINUAR* (ou Esc) volta ao treino.
- [x] **Dado** o treino, **então** o botão de corrida diz **ESCOLHER PISTA** (ou **IR PARA
      A PROVA** no dia da prova da carreira), e *START RACE!* só aparece na escolha de pista.
- [x] **Dado** o treino, **quando** aperto *ESCOLHER PISTA*, **então** a cortina na cor da
      égua cobre a tela, a escolha de pista aparece por baixo e monta em cascata; o mesmo
      no *VOLTAR*, no *START RACE!* e na volta da corrida ao treino.
- [x] **Dado** energia 30, **quando** descanso (+45), **então** a barra enche suave de 30 a
      75 e o número conta junto; não aparece pronta de uma vez.
- [x] **Dado** um treino concluído, **então** o atributo, a barra da nota e a energia
      animam até o valor novo.
- [x] **Dado** a loja de skills, **quando** troco o filtro, **então** o fundo do segmento
      desliza e os cartões entram em cascata; **quando** aprendo uma skill, a carteira de
      SP conta para baixo.
- [x] **Dado** `prefers-reduced-motion: reduce`, **então** nada se move: as telas e os
      valores aparecem direto no estado final.
- [x] Todas as animações são GSAP: não sobra `@keyframes` nem `transition` de movimento
      nos arquivos desta task.
- [x] As telas cabem numa janela de desktop sem rolar (como a corrida, `6618bff`); na de
      skills só a grade rola.

## 7. Como verificar

```bash
npm run build --prefix frontend
npm run dev --prefix frontend
```

- Manual: no dev server, abrir a carreira da Nice Nature, descansar e entrar na escolha
  de pista; repetir com outra égua. **Não correr contra o backend local**, que usa o banco
  real: na escolha de pista, só conferir a tela, sem apertar *START RACE!*.
- Animações: clicar *ESCOLHER PISTA* e *VOLTAR* várias vezes seguidas (não pode navegar
  duas vezes nem travar a cortina); descansar e ver a barra encher; no DevTools,
  *Rendering → Emulate prefers-reduced-motion: reduce* e repetir (tudo instantâneo).
- Regressão a observar: o aviso de erro do descanso (energia 100, carreira encerrada)
  continua aparecendo; a escolha de pista ainda pré-seleciona a prova da carreira.

## 8. Impacto em documentação
- [x] `README.md` — sem mudança (atenção: está em UTF-16)
- [x] `docs/guia-do-jogador.md` — botão *Skills* e a loja já entraram (seções 1 e 5); falta
      descanso/pista, se o guia citar, e trocar "**Start race!** só libera com 35 de energia"
      (seção 1) por **Escolher pista**
- [x] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| GIFs de 6 MB (`Rest1`, `Skills1`) demoram a aparecer na primeira abertura do descanso e das skills | baixo | Pré-carregar os dois quando o treino abre; converter só se o jogo for hospedado |
| O nome vertical tem tamanho fixo (87) e nomes longos ("NICE NATURE", 11 letras) podem não caber na altura | baixo | No código, reduzir a fonte conforme o comprimento do nome |
| A TrainScreen v2 agora mostra o nome duas vezes (vertical e no cabeçalho) | baixo | Eduardo decide se o do cabeçalho sai; o nome vertical no treino ainda não está no código da `15` |
| O título do Figma está em inglês ("Well rested!") e o resto em português | baixo | Eduardo decide; por padrão, seguir o Figma |
| Cortina entre rotas atrasando quem joga rápido | médio | Teto de ~0,6 s; clique durante a transição é ignorado; reduced motion corta seco |
| GSAP x React 19 (StrictMode monta duas vezes em dev) | baixo | `gsap.context()` + `revert()` no cleanup, como no `RaceRunner`; não usar tween fora de efeito |
| Hover via GSAP é mais código que `:hover` com `transition` | baixo | Pedido do Eduardo: GSAP em tudo. Um helper (`useHoverScale`) para não repetir |
| Só a Nice Nature tem as animações novas | baixo | Fallback para `Profile1.gif`; as outras ganham GIF quando houver captura |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] Build passa: `npm run build --prefix frontend`
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Commit e push na branch `feat/ui-v2-rest-track`; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-10-01 | Task criada. O Eduardo pôs no Figma os GIFs da Nice Nature (bocejando na RestScreen v2 e correndo na ChooseTrackScreen v2). Os dois foram copiados para `frontend/public/horses/NiceNature/` como `Rest1.gif` e `Run1.gif`. |
| 2026-10-01 | SkillsScreen entrou na task. No Figma, a partir do rascunho *SkillsScreen v1* do Eduardo, montei a *SkillsScreen v2* (`2263:84`, ao lado): eyebrow corrigido, carteira de SP, filtro segmentado e cartões 2×3 com raridade, custo, efeito, gatilho e os estados aprender / aprendida / faltam SP. No código, `SkillsScreen` em tela cheia no lugar do `SkillPanel`. Arte: `Skills1.gif` (o `UmaViewer_2026-09-30_23-57-31-710.gif`, o mesmo do frame v1). Conferido com API simulada no navegador (sem backend, nada gravado) em 1366×768 (cabe sem rolar a página; só a grade rola), com Nice Nature (`Skills1.gif`) e Oguri Cap (fallback `Profile1.gif`), e em 375 px (sem rolagem horizontal). |
| 2026-10-01 | Ajustes no Figma (seção 3, *Ajustes de 2026-10-01*): céu estrelado sem glow na RestScreen v2 e nome vertical padronizado (Inter Black 87, atrás da égua) nas quatro telas v2, incluindo a TrainScreen v2. Código ainda não acompanha: o `SkillsScreen` já implementado usa o nome antigo. |
| 2026-10-01 | Escopo ampliado a pedido do Eduardo: transição suave entre as telas da carreira e animações da GUI (energia enchendo no descanso, números e barras do treino, skills, escolha de pista), **tudo com GSAP**, não CSS; respeitando reduced motion. E o botão *START RACE!* do treino vira **ESCOLHER PISTA** (ou **IR PARA A PROVA** no dia da prova), deixando *START RACE!* só na escolha de pista. Tamanho M → G. |
| 2026-10-01 | Figma: na TrainScreen v2, *START RACE!* → **ESCOLHER PISTA** ("prova avulsa · −35 energia · 1 turno") e *VER SKILLS* → **SKILLS**; criada a variante **IR PARA A PROVA** (`2266:468`, abaixo do frame) para o dia da prova da carreira. |
| 2026-10-01 | Código. `RestScreen` (céu estrelado e lua exportados do Figma como SVG; barra de energia enche de antes a depois, número conta junto, chip `+N` pula no fim, "Z z z" flutua). `RaceTrackSelect` e `TrackCard` v2 (grade 3×2, chips pronta/abaixo e dificuldade, estratégia segmentada, START RACE! com resumo; descrição e requisitos foram para o tooltip do cartão). Treino: **ESCOLHER PISTA** / **IR PARA A PROVA**, nome vertical, energia/SP/fãs/atributos/barra da nota animados; o treino "congela" o que mostra enquanto minigame, descanso ou skills estão por cima, e anima ao fechar. Nome vertical num componente só (`VerticalName`, Inter Black carregada do Google Fonts) nas quatro telas. Animações em `frontend/src/animations/` (`useCountUp`, `useBarTween`, `useStaggerIn`, `useSegmentSlider`, `useHoverScale`, `useScreenEnter`/`useScreenExit`) e cortina em `PageTransition` (cobre em 0,28 s, espera a tela nova até 0,25 s, sai em 0,3 s; clique durante a transição é ignorado; voltar do navegador não usa cortina). Os hooks de número e barra usam *callback ref*, porque no treino e na pista os nós só aparecem depois do fetch. |
| 2026-10-01 | A pedido do Eduardo, o `Run1.gif` toca uma vez e para: tirei o bloco de loop do arquivo, e `useFreshGif` dá uma URL de blob nova a cada visita para ela correr de novo ao voltar à tela (o Chrome guarda o fim da animação por URL). |
| 2026-10-01 | Conferido no navegador com API simulada (XHR falso só na aba; nada chegou ao backend nem ao banco) em 1366×768: as três telas cabem sem rolar; cortina em ESCOLHER PISTA / VOLTAR com duplo clique ignorado; voltar do navegador sem cortina; descanso 30 → 75 com a barra enchendo e, ao CONTINUAR, a energia do treino animando; skills com SP contando para baixo, filtro deslizando e flash verde; nota D → B dando a volta na barra e a letra pulsando; dia da prova com **IR PARA A PROVA** e a pista única "Sem inscrição"; reduced motion (simulado) sem cortina e tudo no estado final; Oguri Cap com `Profile1.gif` nas três telas; 375 px sem rolagem horizontal. A saída da corrida para o treino com cortina não foi exercida (não corri), mas usa o mesmo caminho. `npm run build` passa. |

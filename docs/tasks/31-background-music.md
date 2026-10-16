# Task 31 — Música de fundo por tela, com botão de liga/desliga

| Campo | Valor |
|---|---|
| **ID** | `31` |
| **Branch** | `feat/bg-music` (nova; a parte A da `24` nunca foi começada na `feat/race-visual-effects`) |
| **Base** | `main` |
| **Status** | ✅ Concluída |
| **Tamanho** | P |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-10-15 |

---

## 1. Contexto
O site não tinha música. A task `24` planejava trilha por tela (parte A), mas sem arquivos.
O Eduardo trouxe três faixas do jogo: o tema do menu de história, o do menu de gacha e
仕掛け (shikake), que deve tocar sempre na corrida.

## 2. Objetivo
Cada tela tem a sua música, que troca com crossfade ao mudar de tela, e um botão no canto
inferior esquerdo liga e desliga.

## 3. Escopo

### Dentro do escopo
- [x] Três faixas em `frontend/public/audio/`: `story-menu.mp3`, `gacha-menu.mp3`,
  `shikake.mp3`.
- [x] Trilha por cena, com crossfade em GSAP (sai em 0,9 s, entra em 1,2 s). Uma faixa
  que volta continua de onde parou.
- [x] Música **ligada por padrão**. Se o navegador bloquear o autoplay, ela começa no
  primeiro clique ou tecla em qualquer lugar da página.
- [x] Botão fixo no canto inferior esquerdo de todas as telas (carreira e corrida não têm
  header): "Play" com ícone quando está parada, "Música" verde com três barras pulando
  (GSAP) quando toca. No celular fica só o ícone.
- [x] Desligar fica guardado em `localStorage` (`umasprint:music:off`).

| Cena | Onde | Faixa |
|---|---|---|
| `site` | Início, catálogos, guia, login, cadastro, perfil, seleção de égua, 404 | Story Menu |
| `career` | `/HorseSelector/Career/:horseId` (o hub) | Story Menu |
| `training` | Minigame de treino, aberto sobre a carreira | Gacha Menu |
| `skills` | Tela de skills, aberta sobre a carreira | Gacha Menu |
| `trackSelect` | `/Race/:horseId` | Gacha Menu |
| `race` | `/Race/:horseId/:trackSlug` | 仕掛け (regra fixa) |

O hub da carreira é calmo e cada ação dela (treinar, skills, escolher pista, correr) muda
a música.

### Fora do escopo
- Partes B–D da `24`: público, troca na reta final, vinhetas, efeitos sonoros, volume por
  canal. Continuam lá.
- Slider de volume: o volume é fixo em 0,35.

## 4. Abordagem técnica
- **`services/bgMusic.ts`** guarda o estado fora do React: um `HTMLAudioElement` por faixa
  (em loop, criado na primeira vez), a cena da rota e uma pilha de cenas sobrepostas. A
  cena atual é o topo da pilha ou a da rota; o mapa `SCENE_TRACK` decide a faixa. É o
  único lugar para trocar as músicas.
- **Cena da rota:** o `MusicToggle`, montado uma vez no `App` dentro do `BrowserRouter`,
  converte o `pathname` em cena.
- **Cenas sobrepostas:** treino e skills não são rotas, são estados do `CareerMenu`. O
  hook `useMusicScene(cena | null)` empilha a cena enquanto a tela está aberta.
- **Crossfade:** `gsap.to(audio, { volume })`; ao fim da saída, `pause()`.
- **Fade travado:** o GSAP anda em `requestAnimationFrame`, que para em aba de fundo ou em
  quadro pesado. Sem nada mais, a faixa que saía nunca pausava (o 仕掛け continuava no
  treino). Um `setTimeout` no fim de cada fade acerta o estado: a faixa que saiu é
  pausada e a que entrou fica no volume cheio.
- **Autoplay bloqueado:** se o `play()` falha com `NotAllowedError`, a música fica
  "bloqueada" e ouve `pointerdown`, `pointerup`, `keydown` e `touchend` no documento. O
  próprio botão é ignorado por esse ouvinte: clicar nele com a música bloqueada só a
  libera, em vez de desligar.
- **Hot reload (dev):** `import.meta.hot.dispose` pausa as faixas do módulo antigo, que de
  outro modo ficariam tocando sem dono.
- Os dois arquivos "Story Menu" eram a mesma gravação (correlação 0,99, ~6 ms de
  defasagem); vai só a versão do AudioCleaner.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/public/audio/*.mp3` | criar | As três faixas (~11 MB). |
| `frontend/src/services/bgMusic.ts` | criar | Estado, mapa cena → faixa, crossfade, autoplay. |
| `frontend/src/hooks/useMusicScene.ts` | criar | Cena de uma tela aberta sobre a rota. |
| `frontend/src/components/MusicToggle/MusicToggle.tsx` / `.css` | criar | Botão e rota → cena. |
| `frontend/src/App.tsx` | editar | Monta o `MusicToggle`. |
| `frontend/src/components/CareerMenu/CareerMenu.tsx` | editar | Cenas de treino e skills. |

**Contratos**

```ts
type MusicScene = "site" | "career" | "training" | "skills" | "trackSelect" | "race";
bgMusic.isPlaying(): boolean;       // ligada e não bloqueada
bgMusic.toggle(): void;             // o botão
bgMusic.setBaseScene(scene): void;  // a rota
bgMusic.pushScene(scene): () => void;
useMusicScene(scene | null): void;
```

## 5. Plano de execução
1. [x] Copiar e comparar as faixas.
2. [x] `bgMusic`, `useMusicScene`, `MusicToggle`; cenas no `CareerMenu`.
3. [x] Música ligada por padrão, com o primeiro clique como reserva.
4. [x] Acerto por timer dos fades travados (bug do 仕掛け no treino).
5. [x] Registrar a task.

## 6. Critérios de aceite
- [x] **Quando** abro o site, **então** toca o Story Menu, sem clicar em nada (ou no
  primeiro clique, se o navegador bloquear).
- [x] **Quando** vou à escolha de pista, **então** entra o Gacha Menu; na corrida, 仕掛け.
- [x] **Quando** abro treino ou skills na carreira, **então** entra o Gacha Menu, e o Story
  Menu volta ao fechar.
- [x] **Quando** saio da corrida para a carreira e treino, **então** o 仕掛け para.
- [x] **Quando** clico no botão, **então** a música some; recarregando, continua desligada.

## 7. Como verificar
- Manual: `npm run dev --prefix frontend`, ir de Início → Play → carreira → treino →
  skills → escolher pista → corrida → voltar.
- Automático: `npm run build --prefix frontend`.
- Verificado no painel do navegador com o mock de XHR, inclusive com o GSAP travado (sem
  `requestAnimationFrame`): só uma faixa toca em cada passo.

## 8. Impacto em documentação
- [x] `docs/guia-do-jogador.md` (botão de música)
- [x] `docs/tasks/24-game-audio.md` (parte A feita aqui)
- [x] `docs/tasks/README.md` (linha da tabela + status)
- N/A — `README.md`, `race-system-design.md` e OpenAPI: nada de regra ou rota mudou.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| As faixas são OST do jogo, baixadas do YouTube | médio | Projeto de fã; o Eduardo decide se fica no repositório público. |
| ~11 MB de mp3 no git | baixo | Pode ir para LFS ou ser recomprimido depois. |
| Ninguém ouviu ainda o equilíbrio de volume entre as faixas | baixo | Eduardo: ajustar `VOLUME` ou a faixa. |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] Build passa: `npm run build --prefix frontend`
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Merge na `main` e push

---

## Registro de execução
| Data | Nota |
|---|---|
| 2026-10-15 | Música por cena com botão Play; mergeada na `main`. |
| 2026-10-15 | Ligada por padrão, a pedido do Eduardo. |
| 2026-10-15 | Corrigido o 仕掛け que continuava no treino (fade travado); push na `main`. |
| 2026-10-16 | Task registrada. |

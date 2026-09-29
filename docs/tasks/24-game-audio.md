# Task 24 — Música e som do jogo (trilha por tela, corrida e efeitos sonoros)

| Campo | Valor |
|---|---|
| **ID** | `24` |
| **Branch** | reusa `feat/race-visual-effects` da task 23 |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | G, feita em partes (A–D), um commit por parte |
| **Depende de** | `23` (parte D: módulo `raceAudio`, eventos e botão de som) |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-09-28 |

---

## 1. Contexto
O jogo é mudo. O único som hoje é o `PlayAudio` do minigame de treino, que toca um `.wav`
solto, sem volume nem mudo. A task `23` cria o módulo `raceAudio`, que emite os eventos da
corrida (`countdownTick`, `gatesOpen`, `skillActivate`, `cutscene`, `finalStretch`,
`finish`), mas não toca nada.

As músicas e os efeitos sonoros ficam com o Eduardo. Esta task monta tudo o que toca e
controla o som. Sem os arquivos, o jogo continua funcionando, só que mudo.

## 2. Objetivo
Todas as telas têm uma música de fundo baixa. A corrida tem música, som ambiente e efeitos
ligados aos eventos da task `23`, e a música muda na reta final. Há volume por canal e mudo
guardados.

## 3. Escopo

### Dentro do escopo

#### Parte A — Música do jogo todo
- [ ] Cada tela toca uma trilha de fundo baixa, em loop:

| Tela | Rota | Trilha |
|---|---|---|
| Início, login, cadastro, catálogos, guia, perfil, 404 | `/`, `/Login`, `/CreateAccount`, `/Horses`, `/Skills`, `/Guide`, `/UserProfile`, `*` | `musicMenu` |
| Seleção de égua e de pista | `/HorseSelector`, `/Race/:horseId` | `musicSelect` |
| Carreira e treino | `/HorseSelector/Career/:horseId` | `musicTraining` |
| Corrida | `/Race/:horseId/:trackSlug` | Parte B |

- [ ] Ao trocar de tela, a trilha troca com crossfade de ~1 s. Entre telas com a mesma
      trilha, ela continua sem recomeçar.
- [ ] O mapa rota → trilha fica num lugar só, para o Eduardo trocar as músicas sem mexer
      nas telas.
- [ ] A música só começa depois da primeira interação (regra dos navegadores). Antes
      disso, nada toca e nada aparece.

#### Parte B — Corrida
- [ ] Na apresentação das rivais e na contagem, toca só o público, baixo.
- [ ] A música de corrida (`musicRace`) começa no "VAI!", bem baixa para não cobrir os
      efeitos.
- [ ] Na **reta final** (`finalStretch` da task `23`), a música muda para `musicFinal` com
      crossfade de ~1 s e o público sobe.
- [ ] Na chegada da égua do jogador (`finish`), a música abaixa e o público vibra.
- [ ] No modal de resultado toca uma vinheta curta: vitória (1º lugar) ou derrota. Depois,
      ao sair da corrida, volta a trilha da tela seguinte.
- [ ] Um loop de cascos toca só enquanto a corrida está rodando.

#### Parte C — Efeitos sonoros
- [ ] Um som por evento da task `23`:

| Evento | Som |
|---|---|
| `countdownTick` | Bip de cada número |
| `gatesOpen` | Portões abrindo |
| `skillActivate` | Brilho curto; variantes para velocidade, fôlego e as outras skills |
| `cutscene` | Impacto da skill `unique` |
| `finalStretch` | Só a troca de música e o público subindo, sem efeito próprio |
| `finish` | Linha de chegada |

- [ ] Skill de rival toca a mesma variante, mais baixa que a do jogador.
- [ ] Os sons do minigame de treino (`correct2.wav`, `incorrect.wav`) passam pelo canal de
      efeitos e respeitam o volume e o mudo.

**Na corrida, a reprodução manda no som**
- [ ] Pausar a corrida pausa música, ambiente e cascos. Retomar continua de onde parou.
- [ ] A música não acelera em 2x e 4x. Em 4x só as skills do jogador tocam som.
- [ ] Voltar com ← não repete os sons de uma vez só (contagem, portões, cutscene, reta
      final, chegada). Voltando para antes da reta final, a música volta a ser `musicRace`.
- [ ] "Pular p/ resultado" corta música e ambiente e vai direto para a vinheta.
- [ ] Durante a cutscene, música e público abaixam para ~40% e voltam depois.

**No jogo todo**
- [ ] Aba em segundo plano: o som pausa, e volta com a aba.

#### Parte D — Controles
- [ ] Um botão 🔊/🔇 em todas as telas: no `RaceHeader` na corrida (o da task `23`) e
      flutuante no canto nas outras.
- [ ] O botão abre um painel pequeno com três volumes (Música, Ambiente, Efeitos) e o mudo
      geral.
- [ ] Os valores ficam no `localStorage` e valem em todas as telas e na próxima visita.
      Padrão: música 30%, ambiente 50%, efeitos 70%.
- [ ] O painel funciona com teclado e em 375px.

### Fora do escopo
- **Criar ou escolher as músicas e os efeitos e fazer a mixagem.** Ficam com o Eduardo. A
  task define os nomes e os formatos (seção 4) e funciona sem eles.
- Som de clique e hover em botões e links (o `PlayAudio` comentado no `CustomLink`).
- Narrador, vozes e música diferente por pista.
- Áudio posicional (som vindo do lado de cada corredora).

## 4. Abordagem técnica

**Um serviço de som para o app todo.** `gameSound` tem um `AudioContext` só, com um
`GainNode` por canal (`music`, `ambience`, `sfx`) ligado a um ganho mestre. Crossfade,
abaixar na cutscene e mudo são rampas de ganho (`linearRampToValueAtTime`), sem cortes. O
serviço vive fora do React, então a música continua quando a rota troca.

**Trilha por rota.** Um `SoundProvider` dentro do `BrowserRouter` observa a rota, acha a
trilha no mapa `routeMusic` e pede o crossfade ao `gameSound`. A corrida avisa o provider
que controla a própria música, e o provider não mexe nela.

**Corrida pelos eventos.** O `raceAudio` da task `23` continua sendo o único ponto de
entrada da corrida e passa a chamar o `gameSound`. Pausa, velocidade e seek vêm do
`useRaceEffects` e do `useRacePlayback`, que já sabem o instante da reprodução.

**Desbloqueio.** O contexto é retomado no primeiro clique, toque ou tecla em qualquer
tela. Os eventos de antes disso são ignorados, sem fila; a trilha da tela começa nessa hora.

**Carregamento.** A trilha da tela atual carrega primeiro; as outras, quando o navegador
fica livre. Os sons da corrida carregam durante a apresentação das rivais. Nenhuma tela
espera o áudio.

**Arquivos ausentes.** Se um arquivo não existe ou falha ao decodificar, aquele som fica
mudo e aparece um `console.warn` só em dev.

**Arquivos esperados** em `frontend/public/audios/`, `.ogg` com `.mp3` de reserva para o
Safari. Loops cortados no zero para não estalar na emenda.

| Chave | Arquivo | Canal | Tipo |
|---|---|---|---|
| `musicMenu` | `music/menu` | música | Loop |
| `musicSelect` | `music/select` | música | Loop |
| `musicTraining` | `music/training` | música | Loop |
| `musicRace` | `music/race` | música | Loop |
| `musicFinal` | `music/race-final` | música | Loop |
| `stingerWin` / `stingerLose` | `music/stinger-win` / `music/stinger-lose` | música | Uma vez |
| `crowdLoop` | `race/crowd-loop` | ambiente | Loop |
| `crowdCheer` | `race/crowd-cheer` | ambiente | Uma vez |
| `hoovesLoop` | `race/hooves-loop` | ambiente | Loop |
| `countdownTick` | `race/countdown-tick` | efeitos | Uma vez |
| `gatesOpen` | `race/gates-open` | efeitos | Uma vez |
| `skillSpeed` / `skillHeal` / `skillGeneric` | `race/skill-speed` / `race/skill-heal` / `race/skill-generic` | efeitos | Uma vez |
| `cutscene` | `race/cutscene` | efeitos | Uma vez |
| `finish` | `race/finish` | efeitos | Uma vez |
| `trainCorrect` / `trainWrong` | `correct2.wav` / `incorrect.wav` (já existem) | efeitos | Uma vez |

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/services/gameSound.ts` | criar | Contexto, canais, carregamento, tocar/loop/crossfade/abaixar, aba oculta |
| `frontend/src/services/soundManifest.ts` | criar | Chave → arquivo, canal, loop, volume base; mapa `routeMusic` |
| `frontend/src/components/sound/SoundProvider.tsx` | criar | Trilha por rota, desbloqueio, configurações |
| `frontend/src/components/sound/SoundPanel.tsx` / `.css` | criar | Botão e painel com os três volumes e o mudo |
| `frontend/src/App.tsx` | editar | `SoundProvider` e botão flutuante |
| `frontend/src/services/raceAudio.ts` | editar | Eventos da corrida chamam o `gameSound` |
| `frontend/src/components/RaceRunner/RaceHeader.tsx` | editar | Botão de som abre o painel |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Pausa, velocidade, seek e saída chegam ao som |
| `frontend/src/components/RaceRunner/RaceResults.tsx` | editar | Vinheta de vitória ou derrota |
| `frontend/src/components/TrainMiniGame/TrainMiniGame.tsx` | editar | Sons do minigame pelo canal de efeitos |
| `frontend/src/utils/PlayAudio.ts` | remover | Substituído pelo `gameSound` |
| `frontend/public/audios/music/`, `frontend/public/audios/race/` | criar | Pastas com um `README.md` listando os arquivos esperados |
| `docs/guia-do-jogador.md` | editar | Botão e painel de som |

**Contratos**

```ts
type SoundChannel = "music" | "ambience" | "sfx";

interface SoundSettings {
  muted: boolean;
  volume: Record<SoundChannel, number>; // 0–1
}
```

## 5. Plano de execução
1. [ ] `gameSound`, manifesto, desbloqueio, arquivos ausentes, aba oculta.
2. [ ] **Parte A:** `SoundProvider`, mapa de rotas, crossfade entre telas.
3. [ ] **Parte B:** público, música da corrida, troca na reta final, chegada, vinhetas, cascos.
4. [ ] **Parte C:** efeitos dos eventos, variantes de skill, rival mais baixa, minigame;
       pausa, 2x/4x, seek, pular para o resultado, cutscene.
5. [ ] **Parte D:** botão, painel e `localStorage`.
6. [ ] Guia do jogador e tabela de status.

## 6. Critérios de aceite
- [ ] **Dado** o jogo aberto na home, **quando** o jogador clica pela primeira vez, **então**
      `musicMenu` começa baixa.
- [ ] **Dado** a home tocando, **quando** o jogador vai para `/Horses`, **então** a música
      continua sem recomeçar; indo para `/HorseSelector`, troca para `musicSelect` sem corte.
- [ ] **Dado** a corrida, **quando** a contagem chega ao "VAI!", **então** os portões soam e
      `musicRace` começa baixa.
- [ ] **Dado** a entrada na reta final, **quando** acontece, **então** a música passa para
      `musicFinal` sem corte e o público sobe.
- [ ] **Dado** a corrida pausada, **quando** a reprodução para, **então** nada toca; ao
      retomar, a música continua do ponto em que parou.
- [ ] **Dado** 4x, **quando** uma rival ativa uma skill, **então** não há som; uma skill do
      jogador toca.
- [ ] **Dado** ← até antes da reta final, **quando** a reprodução volta, **então** a música
      é `musicRace`, e a reta final não soa de novo ao cruzar outra vez.
- [ ] **Dado** a cutscene aberta, **quando** ela aparece, **então** música e público
      abaixam e voltam quando ela fecha.
- [ ] **Dado** a égua em 1º, **quando** o resultado abre, **então** toca a vinheta de
      vitória; em qualquer outra posição, a de derrota.
- [ ] **Dado** o minigame de treino, **quando** o jogador acerta com Efeitos em 0, **então**
      não há som.
- [ ] **Dado** Música em 0 e Efeitos em 100, **quando** a página recarrega, **então** os
      valores continuam em todas as telas.
- [ ] **Dado** as pastas de áudio vazias, **quando** o jogador navega e corre, **então** nada
      toca e não há erro no console fora do modo dev.
- [ ] **Dado** outra aba aberta, **quando** o jogador troca, **então** o som pausa e volta
      com a aba.

## 7. Como verificar

```bash
npm run dev --prefix frontend
```

Nunca correr contra o backend local: ele usa o banco real e correr gasta o save. Para a
corrida, usar o mock da API da task `23`. Para testar sem os áudios finais, colocar sons
curtos de teste nas pastas e tirá-los antes do commit.

- Manual: navegar por todas as rotas da tabela da parte A; corrida em 1x, 2x e 4x,
  pausando, voltando com ←, pulando para o resultado e trocando de aba; painel em 1430px e
  375px; Chrome e Firefox, e Safari se der.
- Automático: `npm run build --prefix frontend` e `npm run lint --prefix frontend`.
- Regressão a observar: os efeitos visuais da task `23` continuam iguais; o minigame de
  treino continua com som.

## 8. Impacto em documentação
- [ ] `docs/guia-do-jogador.md`: botão e painel de som
- [ ] `docs/tasks/README.md` (linha da tabela + status)
- N/A `README.md`, `docs/race-system-design.md` e a spec da API: nada muda no motor nem nas rotas.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Áudio com direitos (trilhas do jogo original) num repositório público | alto | O Eduardo escolhe os arquivos; anotar a origem e a licença no `README.md` das pastas |
| Autoplay bloqueado, principalmente no Safari do iPhone | médio | Tudo começa no primeiro toque; antes disso, silêncio |
| Músicas pesam no primeiro carregamento | médio | Só a trilha da tela atual carrega logo; as outras depois; nenhuma tela espera o áudio |
| Música o tempo todo cansa | baixo | Volume padrão baixo (30%) e mudo guardado |
| Sons empilhados em 4x | baixo | Só skills do jogador em 4x; um som por chave por vez |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npm run build --prefix frontend` e `npm run lint --prefix frontend` passam
- [ ] Sem `console.log` / código morto deixado para trás; mock e sons de teste apagados
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/race-visual-effects`; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-28 | Task criada. Continua na branch da task `23`, que prepara os eventos de som. |
| 2026-09-28 | Escopo ampliado: música de fundo em todas as telas, não só na corrida. O Eduardo coloca as músicas e os efeitos. |

# Task 24 — Som da corrida (música, ambiente e efeitos sonoros)

| Campo | Valor |
|---|---|
| **ID** | `24` |
| **Branch** | reusa `feat/race-visual-effects` da task 23 |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | M |
| **Depende de** | `23` (parte D: módulo `raceAudio`, eventos e botão de som) |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-09-28 |

---

## 1. Contexto
A task `23` deixa a corrida com efeitos visuais e cria o módulo `raceAudio`, que só emite
os eventos (`countdownTick`, `gatesOpen`, `skillActivate`, `cutscene`, `finalStretch`,
`finish`) e guarda volume e mudo. Nada toca. A corrida continua muda. O único som do jogo
hoje é o `PlayAudio` do minigame de treino, que toca um `.wav` solto sem controle de volume
nem mudo.

## 2. Objetivo
A corrida tem música, som ambiente de arquibancada e efeitos sonoros ligados aos eventos da
task `23`, com volume por canal e mudo guardados. Sem os arquivos de áudio, nada toca e
nada quebra.

## 3. Escopo

### Dentro do escopo

#### Música
- [ ] A música de corrida começa no "VAI!" (`gatesOpen`) e fica em loop.
- [ ] Na reta final (`finalStretch`) ela troca para a trilha tensa com crossfade de ~1 s.
- [ ] Quando a égua do jogador cruza a linha (`finish`), a música abaixa em ~1,5 s.
- [ ] No modal de resultado toca uma vinheta curta: vitória (1º lugar) ou derrota (o resto).

#### Ambiente
- [ ] Um loop de público toca desde a abertura da tela (apresentação das rivais e
      contagem), baixo.
- [ ] O público sobe na reta final e vibra quando a égua do jogador cruza a linha.
- [ ] Um loop de cascos toca só enquanto a corrida está rodando.

#### Efeitos sonoros
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

#### Reprodução
- [ ] Pausar a corrida pausa música, ambiente e cascos. Retomar continua de onde parou.
- [ ] A música não acelera em 2x e 4x. Em 4x só as skills do jogador tocam som.
- [ ] Voltar com ← não repete os sons de uma vez só (contagem, portões, cutscene, reta
      final, chegada). Se voltar para antes da reta final, a música volta à trilha normal.
- [ ] "Pular p/ resultado" corta música e ambiente e vai direto para a vinheta.
- [ ] Durante a cutscene, a música e o ambiente abaixam para ~40% e voltam depois.
- [ ] Aba em segundo plano: tudo pausa. Sair da tela de corrida: tudo para.

#### Controles
- [ ] O botão 🔊/🔇 da task `23` abre um painel pequeno com três volumes (Música,
      Ambiente, Efeitos) e o mudo geral.
- [ ] Os quatro valores ficam no `localStorage` e valem na próxima corrida.
- [ ] O painel funciona com teclado e em 375px.

### Fora do escopo
- **Criar ou escolher os arquivos de áudio e a mixagem.** Ficam com o Eduardo. A task
  define os nomes e os formatos (seção 4) e funciona sem eles.
- Som fora da corrida (menus, treino, loja). O `PlayAudio` do treino fica como está.
- Narrador, vozes e música diferente por pista.
- Áudio posicional (som vindo do lado de cada corredora).

## 4. Abordagem técnica

**Web Audio com três canais.** Um `AudioContext` só, com um `GainNode` por canal
(`music`, `ambience`, `sfx`) ligado a um ganho mestre. Crossfade, abaixar na cutscene e
mudo são rampas de ganho (`linearRampToValueAtTime`), sem cortes. Os buffers são baixados
e decodificados quando a tela de corrida abre, em paralelo com a apresentação das rivais.

**Desbloqueio.** O navegador só deixa tocar depois de uma interação. O contexto é
retomado no primeiro clique ou tecla da tela (pular a contagem já conta). Antes disso os
eventos são ignorados, sem fila.

**Ligado aos eventos, não à tela.** `raceAudio` (task `23`) continua sendo o único ponto
de entrada. Esta task troca os eventos vazios por um `raceSound` que toca os sons. Os
componentes não chamam áudio direto. Pausa, velocidade e seek vêm do `useRaceEffects` e do
`useRacePlayback`, que já sabem o instante da reprodução.

**Arquivos ausentes.** Cada som vem de um manifesto. Se o arquivo não existe ou falha ao
decodificar, aquele som fica mudo e aparece um `console.warn` só em dev.

**Arquivos esperados** em `frontend/public/audios/race/`, `.ogg` com `.mp3` de reserva
para o Safari, em torno de −16 LUFS, somando menos de 3 MB:

| Chave | Arquivo | Tipo |
|---|---|---|
| `musicRace` | `music-race` | Loop |
| `musicFinal` | `music-final` | Loop |
| `stingerWin` / `stingerLose` | `stinger-win` / `stinger-lose` | Uma vez |
| `crowdLoop` | `crowd-loop` | Loop |
| `crowdCheer` | `crowd-cheer` | Uma vez |
| `hoovesLoop` | `hooves-loop` | Loop |
| `countdownTick` | `countdown-tick` | Uma vez |
| `gatesOpen` | `gates-open` | Uma vez |
| `skillSpeed` / `skillHeal` / `skillGeneric` | `skill-speed` / `skill-heal` / `skill-generic` | Uma vez |
| `cutscene` | `cutscene` | Uma vez |
| `finish` | `finish` | Uma vez |

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/services/raceSound.ts` | criar | Contexto, canais, carregamento, tocar/loop/crossfade/abaixar |
| `frontend/src/services/raceAudioManifest.ts` | criar | Chave → arquivo, loop ou não, volume base |
| `frontend/src/services/raceAudio.ts` | editar | Eventos chamam o `raceSound`; volumes por canal no `localStorage` |
| `frontend/src/components/RaceRunner/RaceSoundPanel.tsx` / `.css` | criar | Painel com os três volumes e o mudo |
| `frontend/src/components/RaceRunner/RaceHeader.tsx` | editar | Botão de som abre o painel |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Pausa, velocidade, seek, aba oculta e saída da tela chegam ao som |
| `frontend/src/components/RaceRunner/RaceResults.tsx` | editar | Vinheta de vitória ou derrota |
| `frontend/public/audios/race/` | criar | Pasta com um `README.md` listando os arquivos esperados |
| `docs/guia-do-jogador.md` | editar | Painel de som |

**Contratos**

```ts
type SoundChannel = "music" | "ambience" | "sfx";

interface RaceSoundSettings {
  muted: boolean;
  volume: Record<SoundChannel, number>; // 0–1
}
```

## 5. Plano de execução
1. [ ] `raceSound` com canais, carregamento, desbloqueio e arquivos ausentes; manifesto.
2. [ ] Música: início, crossfade da reta final, fim e vinhetas.
3. [ ] Ambiente: público, subida, vibração na chegada, cascos.
4. [ ] Efeitos dos eventos, variantes de skill, rival mais baixa, abaixar na cutscene.
5. [ ] Pausa, 2x/4x, seek, pular para o resultado, aba oculta, saída da tela.
6. [ ] Painel de volumes e `localStorage`.
7. [ ] Guia do jogador e tabela de status.

## 6. Critérios de aceite
- [ ] **Dado** os arquivos na pasta, **quando** a contagem chega ao "VAI!", **então** os
      portões soam e a música de corrida começa.
- [ ] **Dado** a entrada na reta final, **quando** acontece, **então** a música passa para
      a trilha tensa sem corte e o público sobe.
- [ ] **Dado** a corrida pausada, **quando** a reprodução para, **então** nada toca; ao
      retomar, a música continua do ponto em que parou.
- [ ] **Dado** 4x, **quando** uma rival ativa uma skill, **então** não há som; uma skill do
      jogador toca.
- [ ] **Dado** ← até antes da reta final, **quando** a reprodução volta, **então** a música
      é a normal, e a reta final não soa de novo ao cruzar outra vez.
- [ ] **Dado** a cutscene aberta, **quando** ela aparece, **então** a música e o público
      abaixam e voltam quando ela fecha.
- [ ] **Dado** a égua em 1º, **quando** o resultado abre, **então** toca a vinheta de
      vitória; em qualquer outra posição, a de derrota.
- [ ] **Dado** Música em 0 e Efeitos em 100, **quando** a página recarrega, **então** os
      valores continuam e só os efeitos tocam.
- [ ] **Dado** a pasta vazia, **quando** a corrida roda, **então** nada toca e não há erro
      no console fora do modo dev.
- [ ] **Dado** outra aba aberta ou a saída da tela, **quando** acontece, **então** o som
      para.

## 7. Como verificar

```bash
npm run dev --prefix frontend
```

Nunca contra o backend local: ele usa o banco real e correr gasta o save. Usar o mock da
API da task `23`. Para testar sem os áudios finais, colocar sons curtos de teste na pasta e
tirá-los antes do commit.

- Manual: `/Race/:horseId/:trackSlug` em 1x, 2x e 4x, pausando, voltando com ←, pulando
  para o resultado e trocando de aba; painel em 1430px e 375px; Chrome e Firefox, e Safari
  se der.
- Automático: `npm run build --prefix frontend` e `npm run lint --prefix frontend`.
- Regressão a observar: os efeitos visuais da task `23` continuam iguais; o som do
  minigame de treino continua tocando.

## 8. Impacto em documentação
- [ ] `docs/guia-do-jogador.md`: painel de som e canais
- [ ] `docs/tasks/README.md` (linha da tabela + status)
- N/A `README.md`, `docs/race-system-design.md` e a spec da API: nada muda no motor nem nas rotas.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Áudio com direitos (trilhas do jogo original) num repositório público | alto | Usar áudio próprio ou livre de royalties, com a licença anotada no `README.md` da pasta. O Eduardo decide |
| Autoplay bloqueado, principalmente no Safari do iPhone | médio | Retomar o contexto no primeiro toque; sem som antes disso |
| Tamanho dos arquivos atrasa a abertura da corrida | médio | Limite de 3 MB, carregar durante a apresentação das rivais, a corrida não espera o áudio |
| Sons empilhados em 4x | baixo | Só skills do jogador em 4x; um som por chave por vez |
| Loop com clique na emenda | baixo | Loops cortados no zero; o Eduardo confere na mixagem |

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

# Task 13 — HUD de desempenho durante a corrida

| Campo | Valor |
|---|---|
| **ID** | `13` |
| **Branch** | `feat/race-telemetry-hud` |
| **Base** | `feat/race-ui-redesign` (depois de atualizada com o motor por turnos) |
| **Status** | 🔍 Em revisão |
| **Tamanho** | M |
| **Depende de** | `11`, `12`, `14` |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-09-23 · reescrita em 2026-09-26 para o motor por turnos |

---

## 1. Contexto
Com a task `12`, o replay passa a carregar a telemetria da égua do jogador turno a turno.
Falta mostrá-la. Hoje, durante a corrida, o jogador vê um retângulo andando e uma barra de
fôlego: ele assiste ao resultado sem entender a causa, e quando perde não sabe o que treinar.

O jogo é de treino: cada corrida deveria ensinar alguma coisa. A informação que responde
isso é sempre a mesma: *ela já chegou no teto? a curva tirou muito? está queimando fôlego
rápido demais para o que falta?*

O motor por turnos (task `14`) facilita muito: cada número é uma conta curta ("Power ÷ 6",
"÷ 1,2 na curva", "velocidade² ÷ 1800"), então o HUD pode mostrar a causa em vez de só o
efeito.

> Esta task foi escrita originalmente para o motor por ticks, com indicadores de subida e
> de estilo de corrida. Os dois saíram: inclinação e estilo estão fora do motor por turnos.
> Voltam quando voltarem ao motor.

## 2. Objetivo
Durante a corrida o jogador consegue ler, turno a turno, como a égua dele está performando
e por quê — sem precisar pausar nem abrir outra tela.

## 3. Escopo

### Dentro do escopo
- [x] Componente `RaceHud`, plugado na faixa reservada pela task `11`.
- [x] **Velocidade**: m/turno atual contra o teto, com o estado em palavras: "acelerando
      (+16)", "no teto", "perdeu 20 na curva", "cansada".
- [x] **Fôlego**: barra com o gasto do último turno e o alcance projetado, desenhado contra
      o que falta de pista.
- [x] **Pressão**: ×1 / ×1,25 / ×1,5, para o jogador entender por que o gasto sobe no fim.
- [x] **Indicador de ritmo**: `safe` / `tight` / `rushed`, com cor e rótulo em português
      ("com sobra" / "no limite" / "forçando").
- [x] **Skills ativas**: os efeitos ativos neste turno (não só o histórico que já existe).
- [x] **Linha do turno**: uma frase curta por turno, por exemplo
      "Turno 7 · 116 m/turno · −9 de fôlego · entrou na curva".
- [x] Um controle para esconder o HUD, para quem só quer assistir à corrida.

### Fora do escopo
- Relatório e gráficos pós-corrida. Fica para uma task própria, se fizer falta.
- Telemetria das rivais.
- Indicadores de subida e de estilo (fora do motor por turnos).
- Mudar o motor. Se faltar um dado, ele entra na task `12`; não se recalcula nada no
  frontend a partir dos stats.

## 4. Abordagem técnica

Números crus não ensinam; número **comparado com uma referência** ensina. Cada indicador do
HUD mostra o valor e contra o que ele está sendo medido:

| Indicador | Valor | Referência que dá sentido |
|---|---|---|
| Velocidade | `runSpeed` | `ceiling` (quanto falta para o teto) e `accel` / `curveLoss` |
| Fôlego | `stamina` | `staminaRange` contra `remaining` |
| Pressão | `pressure` | 1 = começo da prova |
| Ritmo | `pace` | as três faixas, com a do meio sendo a desejável |
| Cansaço | `tired` | quando `true`, teto pela metade: vira o alerta principal |

**Sem interpolação.** A telemetria é por turno e o motor só decide uma vez por turno, então
o HUD mostra o turno em curso (`Math.ceil(playback.time)`) sem interpolar. Em 1x um turno
dura 1 segundo; em 4x, 250ms, o que ainda é legível para números inteiros. A posição e a
barra de fôlego continuam interpoladas como hoje.

Duas regras de leitura para o HUD não virar um painel de avião:

1. **Silêncio é informação.** Indicador em estado neutro fica apagado; só ganha cor e
   destaque quando sai do normal (curva cobrando caro, ritmo forçado, cansada).
2. **Uma frase por vez.** No máximo um alerta textual em destaque; os outros ficam como
   ícone ou barra.

O alerta de `rushed` é o mais importante do HUD e merece tratamento próprio: ele aparece
enquanto ainda dá para o jogador entender a causa (rápida demais para o tanque? pressão do
último terço?), não no momento em que a barra zera.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/RaceRunner/RaceHud.tsx` | criar | O HUD |
| `frontend/src/components/RaceRunner/RaceHud.css` | criar | Estilo, sobre os tokens da task `11` |
| `frontend/src/components/RaceRunner/useRacePlayback.ts` | editar | Devolve a telemetria do turno em curso |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Monta o HUD na faixa reservada |
| `frontend/src/constants/raceTelemetry.ts` | criar | Rótulos, limiares de cor e textos em pt-BR |
| `frontend/src/types/race.ts` | editar | Já espelhado na task `12`; conferir |
| `frontend/src/components/ui/Meter/` | editar | `marker` (linha de referência, para o teto pela metade) e tom `curve` |
| `frontend/src/styles/tokens.css` | editar | `--danger-soft` e `--curve-soft`, nos dois temas |

**Contratos**

`useRacePlayback` ganha `telemetry: RunnerTelemetry | null` em `RacePlaybackState`: o item
de `simulation.telemetry` cujo `turn` é o turno em curso (ou o último, depois da chegada).

## 5. Plano de execução
1. [x] Atualizar `feat/race-ui-redesign` com o motor por turnos (merge de `main` depois da
       `14`) e resolver o relógio e os tempos, que passam a ser em turnos.
2. [x] Estender `useRacePlayback` com a telemetria do turno em curso.
3. [x] Montar o esqueleto do `RaceHud` mostrando os valores crus, para conferir os dados.
4. [x] Velocidade e fôlego com as referências.
5. [x] Indicador de ritmo, pressão e o alerta de `rushed` / cansada.
6. [x] Skills ativas e a linha do turno.
7. [x] Regra do silêncio: apagar o que está neutro; aplicar cor só no que está fora do normal.
8. [x] Botão de esconder o HUD e responsividade.
9. [x] Atualizar o guia do jogador com a leitura do HUD.

## 6. Critérios de aceite
- [x] **Dado** uma corrida em andamento, **quando** o jogador olha o HUD, **então** vê
      velocidade contra o teto, fôlego, pressão e ritmo sem pausar nada.
- [x] **Dado** uma égua com Stamina baixa numa pista longa, **quando** ela passa do
      primeiro terço, **então** o HUD mostra "forçando" **antes** de ela ficar cansada.
- [x] **Dado** um turno em que ela entra numa curva, **quando** o turno aparece no HUD,
      **então** ele mostra quanto de velocidade a curva tirou; nos turnos seguintes mostra
      a reaceleração até voltar ao teto.
- [x] **Dado** a égua cansada, **quando** o jogador olha o HUD, **então** o alerta
      principal é o cansaço, com o teto pela metade visível.
- [x] **Dado** o playback em 4x, **quando** a corrida roda, **então** os números continuam
      legíveis e não piscam entre estados dentro de um turno.
- [x] **Dado** o botão de esconder, **quando** o jogador o usa, **então** a corrida segue
      normalmente e a escolha vale até o fim da prova.
- [x] **Dado** um celular (375px), **quando** a corrida roda, **então** o HUD continua
      legível (pode reduzir para os três indicadores principais: velocidade, fôlego, ritmo).

## 7. Como verificar

```bash
npm run dev --prefix backend
```

```bash
npm run dev --prefix frontend
```

Cenários de teste, todos alcançáveis com as éguas do seed:

| Cenário | Como montar | O que deve aparecer |
|---|---|---|
| Ritmo forçado | Égua com Stamina baixa em Tokyo | "forçando" no meio da prova, depois "cansada" e o teto pela metade |
| Curvas | Kyoto (duas curvas seguidas antes da reta final) | Perda na entrada de cada curva e reaceleração nos turnos seguintes |
| Velocista | Silence Suzuka em Sapporo | Chega no teto cedo, fôlego acaba perto da linha, ainda vence |
| Corrida limpa | Égua bem treinada para a pista | Tudo neutro, HUD apagado — o silêncio também é resposta |

- Regressão a observar: a animação continua fluida em 4x com o HUD ligado (sem re-render de
  todas as raias a cada frame).

## 8. Impacto em documentação
- [x] `README.md` — mencionar o HUD na descrição da corrida
- [x] `docs/race-system-design.md` — referenciar a seção de telemetria da task `12`
- [x] `docs/guia-do-jogador.md` — seção "Lendo o HUD da corrida"
- [x] `docs/tasks/README.md`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| HUD vira poluição visual e atrapalha assistir à corrida | alto | Regra do silêncio + botão de esconder; validar com o Eduardo depois do passo 6 |
| `feat/race-ui-redesign` foi feita sobre o motor por ticks | médio | Passo 1: trazer o motor por turnos antes de começar o HUD |
| Re-render a cada frame derruba o FPS | médio | O HUD só muda uma vez por turno; memoizar as raias para não re-renderizarem junto |
| Jogador novo não entende "m/turno" | médio | Rótulos em linguagem de jogo e uma seção no guia; números crus ficam como detalhe secundário |
| Qual desses indicadores realmente ajuda? | médio | Começar pelos três principais (velocidade, fôlego, ritmo) e só então avaliar pressão e linha do turno |

## 10. Definition of Done
- [x] Critérios de aceite (seção 6) todos marcados
- [x] `npm run build --prefix frontend` passa
- [x] Sem `console.log` deixado para trás
- [x] Documentação da seção 8 atualizada
- [x] Commit e push em `feat/race-telemetry-hud`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Task escrita para o motor por ticks. |
| 2026-09-26 | Reescrita para o motor por turnos da task `14`: saem os indicadores de subida e de estilo e a interpolação da telemetria; entram teto, aceleração, perda na curva, pressão, cansaço e a linha do turno. |
| 2026-09-27 | Implementada. Base: `feat/race-ui-redesign` com `main` mergeada (passo 1) e `feat/race-telemetry-engine` mergeada por cima. Notas abaixo. |

**Como foi verificado.** O backend local aponta para o banco real e uma corrida gasta
energia e turnos do save, então a tela foi conferida com um mock temporário da API
(`GET /track` e `POST /race/run` servindo `simulateRace` de verdade, com rivais do
`generateRivals`), já apagado. Os quatro cenários da seção 7 foram rodados; o texto do HUD
foi amostrado a cada 20–50ms durante o playback:

| Cenário | Resultado |
|---|---|
| Ritmo forçado (Tokyo, 70% da Stamina) | "forçando" desde o turno 1; "cansada" no 19, alerta trocado, barra de velocidade com o teto caindo de 116 para 58 |
| Curvas (Kyoto) | Turno 14 "perdeu 17 na curva" (tom de curva) → 15 "acelerando (+16)" → 16 "(+1)" → 17 "no teto" |
| Velocista (Silence Suzuka em Sapporo) | No teto no turno 7, "forçando" desde a largada, cansada no 16, segue em 1º |
| Corrida limpa (Hakodate, bem treinada) | Todos os cartões apagados; só a pressão ×1,25 em tom normal |

- 4x e 2x: 700 amostras, **um único estado por turno** — nada pisca dentro de um turno.
- 375px: só velocidade, fôlego e ritmo; `scrollWidth === clientWidth`.
- Esconder HUD: cartões e alerta somem, a corrida segue, o botão vira "Mostrar HUD"
  (`aria-expanded`), e a escolha fica até o resultado.
- Console sem erros; `npm run build --prefix frontend` e `eslint` limpos.

**Decisões.**
- O cartão de Fôlego mostra o tanque (%) e a barra de **alcance contra a pista que falta**;
  o veredito concreto ("seca ~575 m antes da linha") fica no cartão de Ritmo. Numa primeira
  versão o valor e a barra mediam coisas diferentes no mesmo cartão.
- Em `rushed`, só o cartão de Ritmo e o alerta ficam vermelhos; o de Fôlego só avermelha
  quando zera. Três blocos vermelhos para um problema só quebravam a regra da frase única.
- `tight` com alguns metros negativos lê "chega na linha no limite", não "seca": está
  dentro da margem da projeção.
- As referências do HUD (teto antes de cansar e fôlego na largada) saem da própria
  telemetria (`max(ceiling)` e `stamina + staminaCost` do turno 1), sem recalcular nada a
  partir dos atributos.
- A escolha de esconder é estado do `RaceRunner`, não `localStorage`: a task pede que valha
  até o fim da prova.

**Depois da revisão do Eduardo (2026-09-27).** Mesmo em 1x a corrida passava rápido demais
para ler o HUD. Duas mudanças:
- **1x = 2 segundos por turno** (`SECONDS_PER_TURN` em `useRacePlayback`); 2x e 4x ficam
  como atalho para quem quer ir rápido.
- **Pausa e passo a passo**: botões "◀ Turno", "Pausar/Continuar" e "Turno ▶" no cabeçalho,
  e atalhos espaço / ← / →. Cada passo vai para o fim do turno anterior ou seguinte ao do
  relógio e pausa, então o HUD mostra aquele turno inteiro, parado. `useRacePlayback` ganhou
  `seek`. Verificado no mock: 1x avança ~2 turnos em 4s; pausado o relógio não anda; três →
  seguidos (antes de um novo render) avançam três turnos; ← volta um.
- Ideia guardada para depois, se ainda fizer falta: câmera lenta automática por 2 turnos nos
  momentos-chave (curva, primeiro "forçando", cansaço, skill).

**Fora do escopo, encontrado no caminho.** A pílula da corredora que cruza a linha
(`left: 100%`) alargava a página: o `clip-path` da pista esconde, mas não corta o overflow.
Corrigido com `overflow: hidden` em `.RaceRunner__course` (layout da task `11`). O README
ainda descrevia a corrida "em ticks de 0,1s"; atualizado junto com a menção ao HUD.

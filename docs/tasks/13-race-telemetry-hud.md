# Task 13 — HUD de desempenho durante a corrida

| Campo | Valor |
|---|---|
| **ID** | `13` |
| **Branch** | `feat/race-telemetry-hud` |
| **Base** | `feat/race-ui-redesign` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | M |
| **Depende de** | `11`, `12` |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-09-23 |

---

## 1. Contexto
Com a task `12`, o replay passa a carregar a telemetria da égua do jogador frame a frame.
Falta mostrá-la. Hoje, durante a corrida, o jogador vê um retângulo andando e uma barra de
fôlego — ele assiste ao resultado sem entender a causa, e quando perde não sabe o que treinar.

O jogo é de treino: cada corrida deveria ensinar alguma coisa. A informação que responde
isso é sempre a mesma — *ela está rápida? está queimando fôlego rápido demais? a subida está
cobrando caro? o estilo que eu escolhi está ajudando agora ou atrapalhando?*

## 2. Objetivo
Durante a corrida o jogador consegue ler, em tempo real, como a égua dele está performando e
por quê — sem precisar pausar nem abrir outra tela.

## 3. Escopo

### Dentro do escopo
- [ ] Componente `RaceHud`, plugado na faixa reservada pela task `11`.
- [ ] **Velocímetro**: velocidade atual em m/s, com a velocidade-alvo como referência, para
      ficar claro quando ela está acelerando, cruzando ou segurando.
- [ ] **Fôlego**: barra com o gasto por segundo e o alcance projetado em metros, desenhado
      contra o que falta de pista.
- [ ] **Indicador de ritmo**: `safe` / `tight` / `rushed`, com cor e rótulo em português
      ("com sobra" / "no limite" / "forçando").
- [ ] **Terreno**: quando em subida ou descida, quanto a inclinação está custando de
      velocidade e cobrando de fôlego.
- [ ] **Estilo**: se o estilo escolhido está somando ou tirando velocidade **na fase atual**,
      com a fase visível.
- [ ] **Skills ativas**: os efeitos ativos neste instante (não só o histórico que já existe).
- [ ] Interpolação da telemetria em `useRacePlayback`, igual ao que já é feito com posição e
      fôlego, para os números não pularem entre frames.
- [ ] Um controle para esconder o HUD, para quem só quer assistir à corrida.

### Fora do escopo
- Relatório e gráficos pós-corrida. Fica para uma task própria, se fizer falta.
- Telemetria das rivais.
- Mudar o motor. Se faltar um dado, ele entra na task `12` — não se recalcula nada no
  frontend a partir dos stats.

## 4. Abordagem técnica

Números crus não ensinam; número **comparado com uma referência** ensina. Cada indicador do
HUD mostra o valor e contra o que ele está sendo medido:

| Indicador | Valor | Referência que dá sentido |
|---|---|---|
| Velocidade | `speed` | `targetSpeed` (acelerando, estável, ou caindo) |
| Fôlego | barra | `staminaRange` contra `remaining` |
| Ritmo | `pace` | as três faixas, com a do meio sendo a desejável |
| Subida | `gradeSpeedFactor`, `gradeDrainFactor` | 1,0 = plano; exibir como ±% |
| Estilo | `styleFactor` | 1,0 = neutro; exibir como ±% na fase atual |

Duas regras de leitura para o HUD não virar um painel de avião:

1. **Silêncio é informação.** Indicador em estado neutro fica apagado; só ganha cor e
   destaque quando sai do normal (subida cobrando caro, ritmo forçado, estilo penalizando).
2. **Uma frase por vez.** No máximo um alerta textual em destaque; os outros ficam como
   ícone ou barra.

O alerta de `rushed` é o mais importante do HUD e merece tratamento próprio: ele aparece
enquanto ainda dá para o jogador entender a causa (subida? spurt cedo demais? estilo
`front` com pouca Stamina?), não no momento em que a barra zera.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/components/RaceRunner/RaceHud.tsx` | criar | O HUD |
| `frontend/src/components/RaceRunner/RaceHud.css` | criar | Estilo, sobre os tokens da task `11` |
| `frontend/src/components/RaceRunner/useRacePlayback.ts` | editar | Interpola e devolve a telemetria |
| `frontend/src/components/RaceRunner/RaceRunner.tsx` | editar | Monta o HUD na faixa reservada |
| `frontend/src/constants/raceTelemetry.ts` | criar | Rótulos, limiares de cor e textos em pt-BR |
| `frontend/src/types/race.ts` | editar | Já espelhado na task `12`; conferir |

**Contratos**

`useRacePlayback` ganha `telemetry: RunnerTelemetry | null` em `RacePlaybackState`.
Valores contínuos (velocidade, gasto, alcance) são interpolados entre frames; valores
discretos (fase, veredito, efeitos ativos) usam o frame anterior, sem interpolar — um
veredito piscando entre dois estados é pior do que um veredito meio segundo atrasado.

## 5. Plano de execução
1. [ ] Estender `useRacePlayback` com a telemetria interpolada.
2. [ ] Montar o esqueleto do `RaceHud` mostrando os valores crus, para conferir os dados.
3. [ ] Velocímetro e fôlego com as referências.
4. [ ] Indicador de ritmo e o alerta de `rushed`.
5. [ ] Indicadores de terreno, estilo e skills ativas.
6. [ ] Regra do silêncio: apagar o que está neutro; aplicar cor só no que está fora do normal.
7. [ ] Botão de esconder o HUD e responsividade.
8. [ ] Atualizar o guia do jogador com a leitura do HUD.

## 6. Critérios de aceite
- [ ] **Dado** uma corrida em andamento, **quando** o jogador olha o HUD, **então** vê
      velocidade atual, gasto de fôlego, ritmo, fase e estilo sem pausar nada.
- [ ] **Dado** uma égua com Stamina baixa correndo em estilo `front`, **quando** ela chega ao
      meio da prova, **então** o HUD mostra "forçando" **antes** de a barra zerar.
- [ ] **Dado** um trecho de subida, **quando** a égua entra nele, **então** o HUD mostra
      quanto a subida está tirando de velocidade e somando no gasto; ao sair, o indicador
      volta ao neutro.
- [ ] **Dado** o estilo `end` na abertura, **quando** o jogador olha o indicador de estilo,
      **então** ele mostra penalidade; no spurt, mostra bônus.
- [ ] **Dado** o playback em 4x, **quando** a corrida roda, **então** os números continuam
      legíveis e não piscam entre estados.
- [ ] **Dado** o botão de esconder, **quando** o jogador o usa, **então** a corrida segue
      normalmente e a escolha vale até o fim da prova.
- [ ] **Dado** um celular (375px), **quando** a corrida roda, **então** o HUD continua legível
      (pode reduzir para os três indicadores principais: velocidade, fôlego, ritmo).

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
| Ritmo forçado | Égua com Stamina baixa em pista longa, estilo `front` | "forçando" antes do fim, seguido de queda de velocidade |
| Subida cara | Pista `incline` com Power abaixo do requisito | Perda de velocidade e gasto extra no trecho íngreme |
| Estilo certo | Estilo `end` numa prova em que ela vence no spurt | Penalidade na abertura, bônus no spurt |
| Corrida limpa | Égua bem treinada para a pista | Tudo neutro, HUD apagado — o silêncio também é resposta |

- Regressão a observar: a animação continua fluida em 4x com o HUD ligado (sem re-render de
  todas as raias a cada frame).

## 8. Impacto em documentação
- [ ] `README.md` — mencionar o HUD na descrição da corrida
- [ ] `docs/race-system-design.md` — referenciar a seção de telemetria da task `12`
- [x] `docs/guia-do-jogador.md` — seção "Lendo o HUD da corrida"
- [x] `docs/tasks/README.md`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| HUD vira poluição visual e atrapalha assistir à corrida | alto | Regra do silêncio + botão de esconder; validar com o Eduardo depois do passo 5 |
| Re-render a cada frame derruba o FPS | médio | O HUD lê a telemetria já interpolada; memoizar as raias para não re-renderizarem junto |
| Jogador novo não entende "m/s" nem "±%" | médio | Rótulos em linguagem de jogo e uma seção no guia; números crus ficam como detalhe secundário |
| Qual desses indicadores realmente ajuda? | médio | Começar pelos três principais (velocidade, fôlego, ritmo) e só então avaliar se terreno e estilo ficam ou saem |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npm run build --prefix frontend` passa
- [ ] Sem `console.log` deixado para trás
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push em `feat/race-telemetry-hud`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Task escrita. |

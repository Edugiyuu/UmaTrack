# UmaSprint — Guia do Jogador

Tudo que você precisa para treinar uma garota-cavalo e ganhar corridas.

Os números deste guia vêm direto do código (`backend/src/data/` e
`backend/src/services/`). Se você mexer nessas tabelas, mexa aqui também.

- [1. Começando](#1-começando)
- [2. Os quatro atributos](#2-os-quatro-atributos)
- [3. A temporada: turnos, energia e humor](#3-a-temporada-turnos-energia-e-humor)
- [4. Treino](#4-treino)
- [5. Skills e skill points](#5-skills-e-skill-points)
- [6. As pistas](#6-as-pistas)
- [7. Estratégia de corrida](#7-estratégia-de-corrida)
- [8. Como a corrida é decidida](#8-como-a-corrida-é-decidida)
- [9. Prêmios](#9-prêmios)
- [10. Roteiro de progressão](#10-roteiro-de-progressão)
- [11. Erros comuns](#11-erros-comuns)

---

## 1. Começando

Crie uma conta em **Create Account**. Você começa com:

- **1.000** de dinheiro
- **1 garota-cavalo sorteada** do elenco, de graça

Em **Play** você vê o elenco. As que você já tem abrem a tela de carreira;
as que ainda não tem abrem a tela de compra. Comprar desconta o preço do seu
dinheiro e você não pode comprar a mesma duas vezes.

Na tela de carreira ficam os botões de treino, o descanso, o painel de skills
e o acesso às corridas.

### O ciclo do jogo

```
Comprar  ->  Treinar (gasta turnos e energia)  ->  Aprender skills com os SP
         ->  Escolher a pista certa  ->  Correr  ->  Prêmio + turnos de volta
         ->  Treinar de novo
```

---

## 2. Os quatro atributos

| Atributo | O que faz na corrida |
|---|---|
| **Speed** | Define o ritmo que ela consegue segurar. É o principal em pistas planas. |
| **Stamina** | O tamanho do tanque de fôlego. Se zerar antes da linha, o ritmo cai para **62%**. |
| **Power** | Aceleração, largada e **subidas**. Numa rampa, é o Power que decide quanta velocidade ela conserva. |
| **Wit** | Economiza fôlego (até −25%), reduz a perda nas curvas e aumenta a chance das skills dispararem. |

O atributo mais alto define o **tipo** dela — e é nesse tipo que ela treina
mais rápido (ver [afinidade](#o-que-entra-na-conta)).

---

## 3. A temporada: turnos, energia e humor

| Recurso | Máximo | Como gasta | Como recupera |
|---|---|---|---|
| **Turnos** | 5 | 1 por treino ou descanso | Terminar uma corrida devolve para 5 |
| **Energia** | 100 | 20 por treino, 35 por corrida | Descansar: **+45** |
| **Humor** | ★★★★★ | Cai ao falhar um treino ou correr mal | Descansar, treinar bem ou vencer |

**Turnos** limitam quanto você treina por temporada. **Energia** limita quantas
corridas você encaixa. Correr é o que fecha a temporada e devolve os turnos.

> **Descanso quando os turnos acabam**
> Se você gastar os 5 turnos treinando, a energia zera junto (5 × 20 = 100).
> Nessa situação o descanso continua disponível e **não cobra turno** — é a
> válvula que impede a Uma de travar sem conseguir treinar, descansar nem correr.

---

## 4. Treino

Escolha o atributo e jogue o minigame: um círculo fecha sobre o alvo e você
aperta **E** no tempo certo. São até **10 acertos**.

O jogo **não** soma seus acertos direto no atributo. O cliente só informa a
pontuação; quem decide o ganho é o servidor.

### O que entra na conta

O ganho é o produto de seis fatores:

| Fator | Efeito |
|---|---|
| **Desempenho** | `0,25 + 0,75 × (acertos/10)^1,15`. Mesmo um round ruim rende alguma coisa; um round perfeito rende o dobro de um round mediano. |
| **Afinidade** | `0,85 + 0,3 × (atributo / maior atributo dela)`. Treinar o forte dela rende até **~15% a mais**; o fraco rende até 15% a menos. |
| **Humor** | ★ 0,85 · ★★ 0,93 · ★★★ 1,00 · ★★★★ 1,07 · ★★★★★ 1,15 |
| **Energia** | ≥60 → 1,00 · 30–59 → 0,80 · 10–29 → 0,55 · <10 → **0,30** |
| **Retorno decrescente** | `1 / (1 + atributo/260)`. Em 100 o ganho já é 72% do original; em 260, metade; em 400, 39%. |
| **Sorte** | ±: um jitter entre 0,90 e 1,15. |

Base por tipo, antes de tudo isso: **Speed 9 · Stamina 9 · Power 8 · Wit 7**.

### Skill points

```
SP = arredonda(ganho × 0,45)     (mínimo 1)
+ 8 de bônus se você acertar os 10 de 10
```

O bônus de round perfeito é grande: num treino que rende 6 pontos, os SP saem
de 3 para 11. **Vale muito mais perseguir o 10/10 do que treinar mais vezes mal.**

### Treinar sem energia é ruim

Abaixo de **25** de energia o treino pode **falhar**: a chance é
`(25 − energia) / 50`, ou seja 50% com a energia zerada. Um treino falhado
rende só 40% do ganho e ainda tira uma estrela de humor.

Com energia abaixo de 10 o multiplicador já é 0,30 — você está queimando um
turno para quase nada. **Descanse antes.**

### Descanso

Gasta 1 turno (ou nada, se você não tiver turnos), devolve **+45** de energia
e **+1** estrela de humor.

---

## 5. Skills e skill points

Skills são aprendidas na tela de carreira gastando SP. Cada uma exige
atributos mínimos e só pode ser aprendida uma vez.

Durante a prova elas disparam **sozinhas**, quando o gatilho acontece. A chance
por segundo é `chance base + Wit × 0,0004` — 150 de Wit soma +6 pontos
percentuais por segundo de janela elegível.

### Catálogo completo

| Skill | SP | Raridade | Efeito | Dispara em | Requisitos |
|---|---:|---|---|---|---|
| Concentração | 60 | Comum | +1,1 m/s por 3s | largada | Pow 40 · Wit 30 |
| Explosão de Portão | 130 | Rara | +45% aceleração por 5s | largada | Spd 60 · Pow 110 · Wit 40 |
| Arrancada Final | 90 | Comum | +0,9 m/s por 5s | reta final | Spd 90 · Wit 50 |
| Passo Relâmpago | 160 | Rara | +1,3 m/s por 4s | meio da prova, em reta | Spd 130 · Pow 60 · Wit 70 |
| Último Fôlego | 240 | **Única** | +1,8 m/s por 6s | últimos 20% | Spd 150 · Sta 120 · Pow 90 · Wit 90 |
| Respiração Constante | 80 | Comum | −20% de gasto de fôlego por 12s | meio da prova | Sta 80 · Wit 60 |
| Segundo Fôlego | 170 | Rara | recupera 18% do fôlego | fôlego abaixo de 30% | Sta 130 · Wit 100 |
| Pulmões de Ferro | 110 | Comum | +25 Stamina na prova | passiva | Sta 100 |
| Escaladora | 120 | Comum | anula 35% da perda em subida por 6s | subida | Sta 60 · Pow 110 · Wit 40 |
| Coração de Montanha | 260 | **Única** | anula 70% da perda em subida por 8s | subida | Spd 60 · Sta 120 · Pow 180 · Wit 60 |
| Planagem | 95 | Comum | +1,0 m/s por 4s | descida | Spd 70 · Wit 90 |
| Força Bruta | 110 | Comum | +25 Power na prova | passiva | Pow 100 |
| Especialista em Curva | 100 | Comum | +0,8 m/s por 4s | curva | Spd 60 · Pow 70 · Wit 90 |
| Leitura de Prova | 150 | Rara | +1,1 m/s por 5s | reta final, do 4º para trás | Spd 80 · Sta 80 · Wit 140 |
| Ritmista | 180 | Rara | −15% de gasto de fôlego por 20s | qualquer momento | Sta 110 · Wit 130 |
| Olhar Aguçado | 110 | Comum | +25 Wit na prova | passiva | Wit 100 |
| Marcha de Sprint | 110 | Comum | +25 Speed na prova | passiva | Spd 100 |

### Quais comprar primeiro

As quatro **passivas** (Pulmões de Ferro, Força Bruta, Olhar Aguçado, Marcha de
Sprint) custam 110 SP e dão +25 fixos do atributo pela prova inteira. São o
melhor custo-benefício no começo: +25 de Power em Kokura vale mais do que
qualquer boost de 4 segundos.

Depois, compre pelo terreno da pista que você quer ganhar:

- **Subida (Kokura, Tokyo)** → Escaladora, depois Coração de Montanha
- **Prova longa (Tokyo)** → Respiração Constante, Ritmista, Segundo Fôlego
- **Plana (Sapporo, Niigata)** → Marcha de Sprint, Passo Relâmpago, Arrancada Final
- **Técnica (Kyoto)** → Especialista em Curva, Planagem, Leitura de Prova

---

## 6. As pistas

Cada pista é dividida em trechos com inclinação e curva próprias. Os
**requisitos são recomendações**, não travas: você pode se inscrever abaixo
deles, mas perde ritmo na proporção do que falta.

| Pista | Dist. | Piso | Terreno | Inclinação | Speed | Stamina | Power | Wit | Campo | 1º lugar | Inscrição | SP |
|---|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Sapporo Sprint | 1200 | Grama | Plana | — | 60 | 35 | 50 | 30 | 8 | 900 | grátis | 25 |
| Niigata Mile | 1600 | Grama | Plana | ±0,5% | 75 | 65 | 60 | 70 | 10 | 1.800 | 120 | 40 |
| Hakodate Rolling | 1800 | Grama | Ondulada | −3% a +3% | 80 | 90 | **95** | 70 | 10 | 2.400 | 200 | 50 |
| Kyoto Downhill | 2200 | Grama | Técnica | −4% a +3,5% | 95 | 110 | 90 | **110** | 12 | 4.200 | 350 | 65 |
| Tokyo Classic | 2400 | Grama | Íngreme | −1% a +4% | 110 | **150** | 115 | 100 | 14 | 8.000 | 600 | 85 |
| Kokura Mountain Climb | 2000 | **Areia** | Íngreme | −2,5% a **+6,5%** | 95 | 130 | **175** | 90 | 12 | 7.000 | 500 | 90 |

Prêmios vão até o **5º lugar** (1º / 2º / 3º / 4º / 5º recebem 100% / 50% / ~27% / ~13% / ~7% do prêmio da pista).

### O que cada pista cobra de você

- **Sapporo** — a pista de treino. Plana, curta, sem inscrição. Speed puro ganha.
- **Niigata** — a primeira que cobra Wit. Reta longa, posicionamento importa.
- **Hakodate** — sobe e desce o tempo todo. Trocar de ritmo cansa: quer Stamina **e** Power.
- **Kyoto** — a descida da terceira curva embala quem tem Wit; as curvas fechadas punem quem não tem.
- **Tokyo** — a mais longa, com subida na reta final. Sem 150 de Stamina ela quebra antes da linha.
- **Kokura** — quase toda em rampa, e na areia (que gasta 8% mais fôlego). **Só passa com Power.**

### Exemplo real

Special Week com **102 Speed / 84 Stamina / 118 Power / 90 Wit**:

| Pista | Resultado |
|---|---|
| Sapporo (60/35/50/30 — ela está acima de tudo) | **1º de 8**, 1:06.77, ~10s na frente do 2º |
| Kokura (95/130/**175**/90 — falta Power e Stamina) | **12º de 12**, 2:49, fôlego zerado antes do fim |

A mesma Uma, sem mudar nada. É a pista que decide.

---

## 7. Estratégia de corrida

Escolhida antes de cada prova. Ela muda o ritmo-alvo em cada fase:

| Estratégia | Largada | Meio | Reta final | Últimos 20% |
|---|---:|---:|---:|---:|
| **Fugitiva** (`front`) | +7% | +3% | −2% | −3% |
| **Ponta** (`pace`) | +2% | +1% | 0% | +2% |
| **Perseguidora** (`late`) | −3% | −1% | +4% | +6% |
| **Fechadora** (`end`) | −8% | −3% | +6% | **+11%** |

- **Fugitiva** quer Speed alto e prova curta. Ela abre vantagem e tenta segurar.
- **Fechadora** quer Stamina sobrando: você gasta pouco no começo para explodir
  no fim. Se o fôlego acabar, o plano inteiro morre.
- **Ponta** é o padrão seguro e quase nunca é a pior escolha.
- **Perseguidora** combina com **Leitura de Prova**, que só dispara do 4º para trás.

---

## 8. Como a corrida é decidida

A simulação roda **no servidor**, em passos de 0,1 segundo, a partir de uma
semente aleatória. O navegador só recebe o replay pronto para animar — não dá
para influenciar o resultado pelo cliente.

### A régua: o requisito da pista

Tudo é medido contra o requisito da pista. Ter **exatamente** o recomendado é
a nota 1,0. O peso de cada atributo varia por pista (Kokura pesa Power 1,6;
Sapporo pesa Speed 1,35), então estar acima do recomendado no atributo que
aquela pista valoriza rende muito mais.

### Ritmo

O ritmo de referência é **16 m/s**. Sobre ele entram a sua nota de Speed, a
fase da prova, a sua estratégia, a inclinação e a curva do trecho.

Fases: **largada** (0–16%) · **meio** (16–66%) · **reta final** (66–80%) ·
**últimos 20%** (80–100%), com o ritmo-alvo subindo de 0,93 para 1,07.

### Fôlego

Você tem **100 unidades de fôlego** se o seu Stamina for exatamente o
recomendado — e isso é precisamente o suficiente para segurar o ritmo de
referência até a linha. Stamina acima do recomendado é sobra para gastar no
final; abaixo, você não chega.

O gasto cresce com o **cubo aproximado da velocidade** (expoente 2,4): correr
10% mais rápido custa ~26% mais fôlego. Some a isso:

- **Subida**: +9% de gasto por ponto percentual de rampa, dividido pelo seu Power
- **Areia** (Kokura): +8%
- **Wit**: economiza até 25%, e as skills de fôlego somam até um teto de 55%

**Fôlego zerado = ritmo a 62% e aceleração pela metade.** É o que separa um
segundo lugar de um décimo segundo lugar.

### Subida

```
velocidade mantida = 1 − (rampa% / 100) × (3,2 − 1,6 × seu Power / Power exigido)
```

Na parede de +6,5% de Kokura:

| Seu Power vs. exigido | Velocidade que você mantém |
|---|---|
| Metade (87 de 175) | **84%** |
| Exatamente (175) | 90% |
| 1,8× (315) | **98%** |

A skill **Coração de Montanha** anula 70% dessa perda enquanto está ativa.

### Curva

Curva fechada tira até 5% do ritmo, e o Wit devolve até 45% dessa perda.
**Especialista em Curva** soma +0,8 m/s por cima.

### Chegada

O tempo é interpolado dentro do passo de 0,1s, então uma chegada apertada é
decidida pela corredora — não pela ordem em que ela aparece na lista.

### As adversárias

O grid é gerado em torno dos **requisitos da pista**, não em torno de você.
Isso é importante: elas **não** escalam com o seu nível, então treinar melhora
sua colocação de verdade. Cada uma puxa para um atributo diferente e pode vir
com algumas skills, conforme a dificuldade da pista.

---

## 9. Prêmios

Correr custa **35 de energia** e a inscrição da pista. Ao terminar, você recebe:

| Colocação | Dinheiro | Skill points e fãs |
|---|---|---|
| 1º | prêmio cheio | 100% |
| 2º | 50% | 60% |
| 3º | ~27% | 42% |
| 4º–5º | ~13% / ~7% | 28% |
| 6º ou pior | **nada** | 15% |

Além disso:

- Os **turnos voltam para 5** — é o que abre a próxima temporada
- Vencer sobe **+1 estrela** de humor
- Terminar na metade de baixo do grid **desce 1 estrela**
- A corrida entra no histórico, visível no seu perfil

Repare que mesmo em último você leva SP e fãs. Perder numa pista difícil pode
render mais SP do que vencer numa fácil: 15% de 90 (Kokura) = 14 SP, contra
100% de 25 (Sapporo) = 25 SP. Mas Kokura ainda cobra 500 de inscrição e não
paga nada abaixo do 5º — **não é um jeito sustentável de farmar.**

---

## 10. Roteiro de progressão

1. **Sapporo Sprint primeiro.** É grátis e você provavelmente já atende os
   requisitos. Ganhe algumas vezes para juntar dinheiro e SP.
2. **Compre as passivas de 110 SP** do atributo que você quer empurrar.
3. **Treine mirando o 10/10**, não o volume. O bônus de +8 SP por round
   perfeito é o que financia as skills.
4. **Descanse antes de cair abaixo de 25 de energia.** Um treino falhado
   custa um turno e ainda tira humor.
5. **Suba para Niigata e Hakodate** quando os requisitos estiverem verdes na
   tela de escolha de pista.
6. **Para Tokyo, priorize Stamina** (150 é bastante). Para **Kokura, priorize
   Power** (175 é o requisito mais alto do jogo) e leve Escaladora.
7. Antes de cada prova, olhe o **check de requisitos no card da pista**: tudo
   verde significa que você está na briga.

### Ordem de treino sugerida

Trate o atributo da pista-alvo como prioridade, mas respeite a afinidade dela.
No pior caso a afinidade vai de 1,15 (o atributo mais alto dela) a 0,85 — o
atributo fraco rende **~26% menos** que o forte, e ainda por cima o forte já
sofre mais retorno decrescente por estar mais alto. Os dois efeitos se cancelam
em parte, então empurrar o fraco não é proibido; só é mais lento.

Quando a diferença é grande demais, às vezes sai mais barato comprar outra
garota-cavalo que já nasce com o perfil da pista que você quer.

---

## 11. Erros comuns

**"Treinei 5 vezes e agora não consigo fazer nada."**
Os 5 turnos consomem exatamente os 100 de energia. Nessa situação o descanso
fica disponível de graça: descanse duas vezes e você volta a poder correr.

**"Corri numa pista difícil e fiquei em último."**
Olhe o aviso no card: os atributos em vermelho estão abaixo do recomendado.
O resultado da corrida também lista quais faltaram. Treine esses.

**"Minha Uma some no fim da prova."**
É o fôlego zerando — o ritmo cai para 62%. Ou o Stamina está baixo para a
distância, ou a estratégia está agressiva demais para o tanque dela.

**"Comprei uma skill e ela não disparou."**
Skills têm gatilho. Escaladora só existe em subida; Leitura de Prova só do 4º
para trás; Segundo Fôlego só com o fôlego abaixo de 30%. Uma skill de subida
numa pista plana nunca vai ativar. E Wit baixo reduz a chance de qualquer uma.

**"O treino rendeu menos que da última vez."**
Confira humor, energia e o quanto aquele atributo já subiu. Os três reduzem o
ganho, e o retorno decrescente é permanente.

---

## Para quem mexe no código

- Pistas: `backend/src/data/tracks.ts`
- Skills: `backend/src/data/skills.ts`
- Regras de treino: `backend/src/services/trainingEngine.ts`
- Motor de corrida: `backend/src/services/raceEngine.ts`
- Prêmios e custos de corrida: `backend/src/controllers/raceController.ts`

Depois de mudar qualquer um deles, rode as verificações:

```bash
cd backend && npm run race:check && npm run training:check
```

O design técnico por trás dessas regras está em
[`race-system-design.md`](./race-system-design.md).

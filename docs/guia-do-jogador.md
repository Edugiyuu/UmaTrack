# UmaSprint — Guia do Jogador

Tudo que você precisa para treinar uma garota-cavalo e ganhar corridas.

Os números deste guia vêm direto do código (`backend/src/data/` e
`backend/src/services/`). Se você mexer nessas tabelas, mexa aqui também.

- [1. Começando](#1-começando)
- [2. Os quatro atributos](#2-os-quatro-atributos)
- [3. A carreira: turnos, energia e humor](#3-a-carreira-turnos-energia-e-humor)
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
| **Speed** | O teto: a velocidade máxima dela, em metros por turno. Correr mais rápido também gasta mais fôlego. |
| **Stamina** | O tamanho do tanque de fôlego. Se zerar antes da linha, a velocidade máxima cai **pela metade** até o fim. |
| **Power** | A arrancada: ela larga com metade do Power e acelera Power ÷ 6 por turno até o teto. É o que a faz recuperar a velocidade depois de cada curva. |
| **Wit** | Economiza fôlego (150 de Wit gasta 30% menos) e aumenta a chance das skills dispararem. |

O atributo mais alto define o **tipo** dela — e é nesse tipo que ela treina
mais rápido (ver [afinidade](#o-que-entra-na-conta)).

### Notas dos atributos

Na tela de treino cada atributo ganha uma **nota**, da G à S, com uma barra do
quanto falta para a próxima. A nota é só uma leitura rápida do número: a corrida
usa o valor, nunca a letra. A escala segue os requisitos das pistas: Sapporo pede
de 30 a 60, e Kokura, a mais dura, chega a 175.

| Nota | G | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| A partir de | 0 | 40 | 60 | 80 | 100 | 125 | 150 | 180 |

Cada botão **Treinar** mostra o custo (−20 de energia). Com energia abaixo de 25
ele avisa *risco de falhar* (ver [Treinar sem energia é ruim](#treinar-sem-energia-é-ruim)),
e o **Start race!** só libera com 35 de energia, dizendo quanto falta.

---

## 3. A carreira: turnos, energia e humor

Cada garota-cavalo tem a **sua carreira**: uma lista de provas, em ordem, com
uma **meta** de colocação em cada uma. Antes de cada prova ela tem alguns
**turnos** para se preparar. Quando os turnos acabam, a prova da carreira é
**obrigatória**: nesse momento não dá para treinar nem escolher outra pista.

- **Bateu a meta** (por exemplo, top 3): a carreira segue, e os turnos da
  próxima prova já estão contando.
- **Não bateu**: a carreira termina ali.
- **Bateu a meta da última prova**: carreira completa.

Carreira terminada, completa ou não, **aposenta** a égua. Ela fica guardada no
seu perfil, com os atributos finais e o resultado de cada prova, e não treina
nem corre mais. Na tela de treino dela aparece **Nova carreira**: a mesma égua
recomeça do zero, com os atributos iniciais, e a aposentada continua no perfil.
Você passa a ter as duas. A nova carreira não custa nada, porque ela já é sua.

A prova da carreira **não cobra inscrição**. Entre uma prova e outra dá para
correr **provas avulsas** em qualquer pista: cada uma gasta 1 turno e 35 de
energia, cobra a inscrição normal e rende prêmio, fãs e skill points. A carreira
não muda com elas.

| Recurso | Máximo | Como gasta | Como recupera |
|---|---|---|---|
| **Turnos** | os da próxima prova | 1 por treino, descanso ou prova avulsa | A prova da carreira entrega os turnos da seguinte |
| **Energia** | 100 | 20 por treino, 35 por corrida | Descansar: **+45** |
| **Humor** | ★★★★★ | Cai ao falhar um treino ou correr mal | Descansar, treinar bem ou vencer |

> **Descanso quando os turnos acabam**
> No dia da prova o descanso continua disponível e **não cobra turno**. Se ela
> chegou sem os 35 de energia da corrida, descanse e corra.

### As carreiras

Os números estão em `backend/src/data/careers.ts`. Cada linha é uma prova:
turnos de preparo antes dela e a meta.

| Égua | Provas (turnos · meta) |
|---|---|
| **Silence Suzuka** | Sapporo (6 · top 3) → Niigata (8 · top 3) → Hakodate (10 · top 3) → Niigata (10 · vencer) → Kyoto (14 · top 3) |
| **Special Week** | Sapporo (6 · top 5) → Niigata (8 · top 3) → Hakodate (10 · top 3) → Kyoto (16 · top 5) → Tokyo (18 · top 3) |
| **Oguri Cap** | Sapporo (6 · top 5) → Hakodate (10 · top 5) → Hakodate (10 · top 2) → Kyoto (14 · top 5) → Kokura (18 · top 5) |
| **Grass Wonder** | Niigata (6 · top 5) → Hakodate (12 · top 5) → Niigata (8 · vencer) → Kyoto (14 · top 5) → Tokyo (16 · top 5) |
| **Nice Nature** | Sapporo (6 · top 5) → Niigata (8 · top 5) → Hakodate (10 · top 3) → Kyoto (16 · top 5) → Tokyo (18 · top 5) |

As primeiras provas são para aquecer; a última é o desafio de cada uma. Numa
simulação com um jogador simples (treina o atributo mais longe do requisito,
compra as passivas, não corre avulsas), de 13% a 52% das carreiras chegam ao
fim. Quem planeja o treino, corre avulsas para juntar SP e escolhe as skills
vai melhor. Para rodar a simulação: `npm run career:check --prefix backend`.

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

Skills são aprendidas na tela de carreira gastando SP. O **único preço são os
skill points**: não há atributo mínimo, então qualquer égua aprende qualquer skill
assim que juntar os pontos. Cada uma só pode ser aprendida uma vez.

Durante a prova elas disparam **sozinhas**, quando o gatilho acontece. A chance
por turno é `chance base + Wit × 0,002` — 150 de Wit soma +30 pontos
percentuais em cada turno da janela elegível.

### Catálogo completo

| Skill | SP | Raridade | Efeito | Dispara em |
|---|---:|---|---|---|
| Concentração | 60 | Comum | +7 m/turno por 1 turno | largada |
| Explosão de Portão | 130 | Rara | +45% aceleração por 1 turno | largada |
| Arrancada Final | 90 | Comum | +5 m/turno por 1 turno | reta final |
| Passo Relâmpago | 160 | Rara | +8 m/turno por 1 turno | meio da prova, em reta |
| Último Fôlego | 240 | **Única** | +11 m/turno por 1 turno | últimos 20% |
| Respiração Constante | 80 | Comum | −20% de gasto de fôlego por 2 turnos | meio da prova |
| Segundo Fôlego | 170 | Rara | recupera 18% do fôlego | fôlego abaixo de 30% |
| Pulmões de Ferro | 110 | Comum | +25 Stamina na prova | passiva |
| Escaladora | 120 | Comum | anula 35% da perda em subida por 1 turno *(sem efeito por enquanto)* | subida |
| Coração de Montanha | 260 | **Única** | anula 70% da perda em subida por 2 turnos *(sem efeito por enquanto)* | subida |
| Planagem | 95 | Comum | +6 m/turno por 1 turno | descida |
| Força Bruta | 110 | Comum | +25 Power na prova | passiva |
| Especialista em Curva | 100 | Comum | +5 m/turno por 1 turno | curva |
| Leitura de Prova | 150 | Rara | +7 m/turno por 1 turno | reta final, do 4º para trás |
| Ritmista | 180 | Rara | −15% de gasto de fôlego por 4 turnos | qualquer momento |
| Olhar Aguçado | 110 | Comum | +25 Wit na prova | passiva |
| Marcha de Sprint | 110 | Comum | +25 Speed na prova | passiva |

### Quais comprar primeiro

As quatro **passivas** (Pulmões de Ferro, Força Bruta, Olhar Aguçado, Marcha de
Sprint) custam 110 SP e dão +25 fixos do atributo pela prova inteira. São o
melhor custo-benefício no começo: +25 de Stamina numa prova longa vale mais do
que qualquer boost de 1 turno.

Depois, compre pelo tipo de pista que você quer ganhar:

- **Prova longa (Tokyo, Kokura, Kyoto)** → Respiração Constante, Ritmista, Segundo Fôlego
- **Curta (Sapporo, Niigata)** → Marcha de Sprint, Passo Relâmpago, Arrancada Final
- **Com muitas curvas (Kyoto, Hakodate)** → Especialista em Curva, Leitura de Prova

> Por enquanto **Escaladora** e **Coração de Montanha** não fazem efeito: o motor
> por turnos ainda ignora a inclinação. Elas voltam a valer quando as pistas forem
> revisadas.

---

## 6. As pistas

Cada pista é dividida em trechos. Por enquanto o que conta na corrida é a
**distância** e **onde ficam as curvas**; inclinação e piso ainda não mudam
nada (isso volta quando as pistas forem revisadas). Os **requisitos são
recomendações**, não travas: quem está exatamente neles chega no limite do
fôlego; abaixo, o tanque tende a secar antes da linha.

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

- **Sapporo** — a pista de treino. Curta, sem inscrição. Speed puro ganha, e dá até para chegar cansada.
- **Niigata** — a primeira milha, e a primeira que cobra Wit para economizar fôlego.
- **Hakodate** — duas curvas na segunda metade: Power para reacelerar depois de cada uma.
- **Kyoto** — duas curvas seguidas antes da reta final, e 2200m de prova: Stamina e Wit.
- **Tokyo** — a mais longa. Sem ~150 de Stamina ela quebra antes da linha.
- **Kokura** — o maior requisito de Power do jogo (175) e 130 de Stamina.

### Exemplo real

Special Week com **102 Speed / 84 Stamina / 118 Power / 90 Wit**, em 30 corridas
contra grids gerados pelo jogo:

| Pista | Resultado |
|---|---|
| Sapporo (60/35/50/30 — ela está acima de tudo) | **1º de 8** nas 30, em ~12,4 turnos, ~10 turnos na frente da 2ª |
| Kokura (95/130/**175**/90 — falta Power e Stamina) | **11º ou 12º de 12**, fôlego zerado antes do fim |

A mesma Uma, sem mudar nada. É a pista que decide.

---

## 7. Estratégia de corrida

A tela ainda deixa escolher **Fugitiva**, **Ponta**, **Perseguidora** ou
**Fechadora**, mas por enquanto a escolha **não muda a corrida**: o motor por
turnos trata todas do mesmo jeito. As estratégias voltam numa próxima versão.

---

## 8. Como a corrida é decidida

A simulação roda **no servidor**, **turno a turno**, a partir de uma semente
aleatória. O navegador só recebe o replay pronto para animar — não dá para
influenciar o resultado pelo cliente. No replay, cada turno dura 2 segundos em 1x.

Dá para **pausar** a corrida e andar **turno a turno** pelos botões do topo ou
pelo teclado: **espaço** pausa e continua, **←** e **→** voltam e avançam um
turno (e já pausam). É o jeito de ler o HUD com calma num momento importante.

### Velocidade

- **Turno 1:** ela sai com Power ÷ 2.
- **Cada turno depois:** soma Power ÷ 6, até bater no teto, que é o Speed.
- **Curva:** ao entrar numa curva a velocidade é dividida por 1,2, e ela
  reacelera nos turnos seguintes.
- Em cada turno ela avança tantos metros quanto a velocidade (com ±2% de
  variação). Os metros que sobram no fim de um trecho contam no seguinte.

Exemplo: Power 96 e Speed 120 largam a 48, depois 64, 80, 96, 112 e chegam a
120 no 6º turno — se nenhuma curva aparecer no caminho.

### Fôlego

Ela começa com o valor do Stamina, e cada turno custa:

```
velocidade² ÷ 1800 × pressão × (1 − desconto)
```

- **Pressão:** ×1 no primeiro terço da prova, ×1,25 no segundo, ×1,5 no último.
- **Desconto:** Wit ÷ 500 mais as skills de fôlego, no máximo 60%.

Como o custo cresce com o quadrado da velocidade, correr mais rápido gasta mais
**por metro**: a 120 m/turno cada metro custa o dobro do que a 60.

**Fôlego zerado = cansada até o fim:** a velocidade máxima cai pela metade e o
Power (a aceleração) para um terço.

### Chegada

Vence quem termina em **menos turnos**. Se duas terminam no mesmo turno, vence
quem cruzou a linha antes dentro dele (metros que faltavam ÷ velocidade). Por
isso o tempo aparece com fração, como **12,47 turnos**.

### As adversárias

O grid tem duas partes:

- **Três rivais**, montadas em cima da **sua** égua: cada atributo delas é
  sorteado entre **90% e 130%** do seu, um por um. Uma pode ter mais Speed e
  menos Stamina que você, outra o contrário. Em média elas são 10% melhores que
  você, então sempre tem alguém do seu nível brigando pela vitória — e não dá
  para fugir delas treinando mais. Elas nunca saem mais fracas que o resto do grid.
- **O resto**, gerado em torno dos **requisitos da pista**. Essas não escalam com
  você: treinar passa na frente delas de verdade.

Antes da largada aparece a janela **Suas rivais**, com os atributos de cada uma
e a diferença para os seus (em vermelho quando ela está acima). A corrida só
começa quando você aperta **Largar!**. Use essa janela para saber de quem ter
medo: uma rival com muito mais Stamina vai te passar no fim se você secar.

Todas as adversárias podem vir com algumas skills, conforme a dificuldade da pista.
Metas de **top 3** exigem vencer pelo menos uma rival; a carreira é difícil de
propósito.

### A tela da corrida

A pista aparece vista de cima, como um oval: a corrida inteira é **uma volta**,
seja qual for a distância, com largada e chegada na reta de baixo. As corredoras
são bolinhas; a sua é a maior, com um halo e o balão **VOCÊ** com a colocação.
No gramado do meio ficam os metros percorridos, o total e quanto falta.

- **LIVE**, à esquerda, é a câmera da sua égua; embaixo dela, a **classificação**
  ao vivo com a diferença para a líder em metros. Com o páreo cheio aparecem as
  cinco primeiras e a sua linha logo abaixo. As rivais levam a etiqueta **RIVAL**.
- **1º LUGAR**, à direita, acompanha quem lidera; embaixo, as últimas **skills**
  que dispararam (as suas em dourado). As rivais não têm arte, então a câmera
  mostra as cores e as iniciais delas.
- Embaixo do HUD, a **faixa da pista** mostra os trechos (retas, curvas, subidas
  e descidas) e onde você está.

### Lendo o HUD da corrida

Abaixo da pista, o HUD mostra o que o motor decidiu para a **sua** égua no turno
que está passando. Ele muda uma vez por turno, nunca no meio de um. Com a corrida
pausada, ← e → mostram o turno anterior e o seguinte. A primeira
linha resume o turno:

```
Turno 7 · 3º · 116 m/turno · −8,1 de fôlego · entrou na curva
```

A colocação dessa linha é a do **começo** do turno; a da pista e da
classificação anda junto com as bolinhas, então num pelotão apertado as duas
podem diferir por alguns lugares.

Os cartões ficam **apagados enquanto está tudo normal** e só ganham cor quando
algo pede atenção. Um HUD todo apagado quer dizer uma corrida limpa.

| Cartão | O que mostra | Quando acende |
|---|---|---|
| **Velocidade** | m/turno contra o teto (o Speed), e o estado: *largada*, *acelerando (+16)*, *no teto*, *perdeu 20 na curva*, *cansada* | Amarelo no turno em que ela entra numa curva; vermelho quando cansa (a barra mostra o teto caindo pela metade) |
| **Fôlego** | Quanto sobra do tanque, o gasto do turno e o **alcance**: quantos metros o fôlego ainda aguenta contra os metros que faltam | Vermelho quando zera |
| **Ritmo** | *com sobra*, *no limite* ou *forçando*, e por quanto | Verde em *no limite*, que é o ideal; vermelho em *forçando* |
| **Pressão** | ×1, ×1,25 ou ×1,5: o multiplicador do gasto no terço atual | Nunca acende; explica por que o gasto sobe no fim |
| **Skills ativas** | Os efeitos ligados neste turno | Quando há algum |

**O aviso mais importante é o *forçando*.** O alcance projeta o fôlego até a
linha na velocidade atual, cobrando cada terço com a pressão dele. Se não chega,
o HUD avisa **vários turnos antes** de ela cansar, para dar tempo de entender por
quê: é Stamina curta para a distância nessa velocidade. Mais Stamina resolve, e
Wit também ajuda, porque baixa o gasto de cada turno.

- **Com sobra:** o alcance passa da linha com folga de 15% ou mais. Ela poderia
  correr uma pista mais longa com esses atributos.
- **No limite:** chega na linha com o tanque perto do fim. É o ponto certo.
- **Forçando:** vai secar antes da linha e terminar com o teto pela metade.

Só um aviso em texto aparece por vez: *cansada* passa na frente de *forçando*.
Quem só quer assistir pode clicar em **Esconder HUD**; a escolha vale até o fim
da prova. No celular, o HUD mostra só velocidade, fôlego e ritmo.

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

- Na **prova da carreira**, bater a meta entrega os turnos da próxima prova;
  não bater encerra a carreira. Uma **avulsa** gasta 1 turno (ver [A carreira](#3-a-carreira-turnos-energia-e-humor))
- Vencer sobe **+1 estrela** de humor
- Terminar na metade de baixo do grid **desce 1 estrela**
- A corrida entra no histórico, visível no seu perfil

Repare que mesmo em último você leva SP e fãs. Perder numa pista difícil pode
render mais SP do que vencer numa fácil: 15% de 90 (Kokura) = 14 SP, contra
100% de 25 (Sapporo) = 25 SP. Mas Kokura ainda cobra 500 de inscrição e não
paga nada abaixo do 5º — **não é um jeito sustentável de farmar.**

---

## 10. Roteiro de progressão

1. **Olhe o calendário da carreira** na tela de treino e treine para a próxima
   prova dele. As avulsas em Sapporo (grátis) ajudam a juntar SP no começo.
2. **Compre as passivas de 110 SP** do atributo que você quer empurrar.
3. **Treine mirando o 10/10**, não o volume. O bônus de +8 SP por round
   perfeito é o que financia as skills.
4. **Descanse antes de cair abaixo de 25 de energia.** Um treino falhado
   custa um turno e ainda tira humor.
5. **Suba para Niigata e Hakodate** quando os requisitos estiverem verdes na
   tela de escolha de pista.
6. **Para Tokyo, priorize Stamina** (150 é bastante). Para **Kokura, priorize
   Power** (175 é o requisito mais alto do jogo) sem esquecer a Stamina.
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

**"Os turnos acabaram e não consigo treinar."**
É o dia da prova da carreira: só ela pode ser corrida. Se a energia não chega
a 35, o descanso sai de graça nesse dia; descanse e corra.

**"Corri numa pista difícil e fiquei em último."**
Olhe o aviso no card: os atributos em vermelho estão abaixo do recomendado.
O resultado da corrida também lista quais faltaram. Treine esses.

**"Minha Uma some no fim da prova."**
É o fôlego zerando — a velocidade máxima cai pela metade. O Stamina está baixo
para a distância, ou ela é rápida demais para o tanque que tem.

**"Comprei uma skill e ela não disparou."**
Skills têm gatilho. Escaladora só existe em subida (e, por enquanto, nem lá
faz efeito); Leitura de Prova só do 4º
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

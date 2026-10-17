# Task 32 — Tela de corrida v3: drone, anéis de fôlego, caderno e tensão

| Campo | Valor |
|---|---|
| **ID** | `32` |
| **Branch** | `feat/race-v3` (nova) |
| **Base** | `main` |
| **Status** | 🔍 Em revisão |
| **Tamanho** | M |
| **Depende de** | `15`, `23` |
| **Bloqueia** | — |
| **Área** | frontend |
| **Criada em** | 2026-10-17 |

---

## 1. Contexto
A corrida v2 (oval com bolinhas) parecia genérica: faltava o "será que ela consegue?" e as
corredoras eram pontos coloridos. No Figma saíram várias versões da "Race v3"; o Eduardo
escolheu a **G** (vista de drone com o fôlego de todas) e os quatro momentos dela
(frames `Race v3 · G1 Largada`, `G2 Skill ativando`, `G3 Reta final`, `G4 Chegada`).

## 2. Objetivo
A tela de corrida passa a ser a G do Figma, **só no visual**: o motor, as regras, as
rivais, as recompensas e o fluxo (contagem, rivais, cutscene, resultado) não mudam.

## 3. Escopo

### Dentro do escopo
- [x] **Pista vista de drone** (`RaceDrone`): uma raia por corredora (8–14), câmera que
  enquadra o pelotão inteiro (o motor espalha o páreo por centenas de metros), portões na
  largada, linha de chegada no fim, sinal de subida, rastro de velocidade.
- [x] **Rosto no anel de fôlego** (`RunnerAvatar`): verde > 50%, amarelo, vermelho < 25%.
  A égua do jogador usa `Selection.png`; as rivais são geradas, então usam as iniciais
  na cor delas. Selo ✦ para skill guardada e ✓ para skill usada; estouro dourado quando
  uma skill dispara.
- [x] **Pelotão** (`RaceField`): todas as corredoras com velocidade do último turno,
  fôlego, queda por turno e skills (guardada / disparando / usada no turno N). Vira
  **Resultado** quando ela cruza a linha.
- [x] **Distância**, **Caderno da treinadora** (`RaceNotebook`: anotações e um veredito
  circulado, tirados só da simulação) e **Percurso** (`RaceCourse`).
- [x] **Barra de tensão** (`RaceTensionBar`): linha de batimento em GSAP que acelera com a
  corrida (baixa → média → alta → acabou), com os mesmos controles de antes.
- [x] **Momentos** sobre a pista (`RaceMoment`): LARGADA!, skill dela (card dourado),
  skill de rival, boa/má largada, RETA FINAL, VITÓRIA! / Nº LUGAR.
- [x] Previsão "passa no T41" nos últimos 40% da prova: velocidades do último turno,
  sem inventar nada.
- [x] Fundo claro (pedido do Eduardo).

### Fora do escopo
- Mudar regras, motor ou dados do backend.
- Fotos para as rivais (os nomes são gerados).

## 4. Abordagem técnica
- `fieldModel.ts` concentra o estado do instante como funções puras: `sampleFrames`,
  `buildField` (posição, fôlego, velocidade, colocação, skills por corredora),
  `projectPass`, `tensionAt`, `notebookNotes`, `courseStops`. Pausar, voltar turno e
  pular continuam funcionando porque tudo deriva do relógio.
- Quem já cruzou a linha é ordenado pelo `finishTime` dos resultados, e a diferença dela
  é medida no instante em que a vencedora cruzou.
- Removidos `RaceOval`, `RaceCam`, `RaceStandings`, `RaceHud`, `TrackStrip`,
  `RaceHeader` e `RaceBanner` (o tipo `Seal` e `BANNER_MS` foram para `RaceMoment`).
- Animações em GSAP (estouro da skill, entrada dos momentos, veredito, batimento).

## 5. Como testar
Sem backend: um mock de XHR (ver memória `browser-test-mock-api`) servindo `/track`,
`/skill` e `/race/run` com corridas geradas pelo próprio `simulateRace` do backend, offline.
Conferido: largada com portões, skill dela e de rivais, reta final com previsão,
vitória e derrota (veredito e ordem corretos), resultado abrindo sozinho no fim,
layout de desktop e de celular, build e lint.

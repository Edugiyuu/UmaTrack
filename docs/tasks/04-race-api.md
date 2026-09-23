# Task 04 — API de corrida

**Branch:** `feat/race-api`

## Objetivo
Expor a corrida, aplicar prêmios e guardar histórico.

## Escopo
- `POST /race/run` (auth): valida posse da Uma, energia e taxa de inscrição,
  roda o motor, aplica prêmio/SP/fãs, gasta energia, repõe turnos.
- `GET /user/me/races`: histórico paginado.
- `backend/src/models/raceResult.ts`.

## Critérios de aceite
- Prêmio e SP creditados de forma atômica.
- Simulação sempre no servidor; o cliente só recebe o replay.

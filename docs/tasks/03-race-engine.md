# Task 03 — Motor de corrida

**Branch:** `feat/race-engine`

## Objetivo
Simulação determinística que transforma atributos + pista + skills em resultado e replay.

## Escopo
- `backend/src/services/raceEngine.ts`: RNG com seed, fases, fôlego, inclinação,
  requisitos, estratégias, ativação de skills, `replay`.
- Geração de adversárias NPC calibradas pela dificuldade da pista.
- Tipos compartilhados em `backend/src/types/race.ts`.

## Critérios de aceite
- Mesma seed ⇒ mesmo resultado.
- Em pista íngreme, Power alto vence Speed alto com stats equivalentes.
- Fôlego insuficiente causa queda de ritmo no final.

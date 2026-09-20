# Task 05 — Treino dinâmico

**Branch:** `feat/dynamic-training`

## Objetivo
Substituir o ganho fixo por um ganho calculado no servidor.

## Escopo
- `backend/src/services/trainingEngine.ts`: score ratio, afinidade por tipo,
  humor, energia, retornos decrescentes, SP e risco de falha.
- `POST .../train` passa a receber `{ trainType, score, maxScore }`.
- `POST .../rest`.

## Critérios de aceite
- Cliente não consegue enviar "pontos" arbitrários.
- Ganhos diminuem conforme o atributo sobe e conforme a energia cai.

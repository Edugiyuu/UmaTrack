# Task 01 — Sistema de pistas

**Branch:** `feat/track-system`

## Objetivo
Modelar pistas com terreno, inclinação e requisitos de atributo, e expor o catálogo.

## Escopo
- `backend/src/models/track.ts`: schema com `segments`, `statWeights`, `requirements`,
  `prizeMoney`, `entryFee`, `surface`, `terrain`, `category`.
- `backend/src/data/tracks.ts`: catálogo inicial (Tokyo, Kyoto, Sapporo, Hakodate,
  Niigata, Kokura) usando as artes já presentes em `frontend/src/assets/tracks/`.
- Seed idempotente na subida do servidor (`ensureTracksSeeded`).
- `GET /track` e `GET /track/:id`.

## Critérios de aceite
- Pelo menos uma pista `flat` de sprint e uma pista `incline` exigindo Power alto.
- Soma dos `lengthRatio` de cada pista == 1.
- Catálogo disponível sem autenticação.

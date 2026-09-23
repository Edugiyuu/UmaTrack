# Task 02 — Skills e skill points

**Branch:** `feat/skill-system`

## Objetivo
Permitir que as garotas-cavalo aprendam skills gastando skill points obtidos no treino.

## Escopo
- `backend/src/models/skill.ts` + `backend/src/data/skills.ts` (catálogo + seed).
- Campos novos na Uma do usuário: `skillPoints`, `skills[]`, `energy`, `mood`.
- `GET /skill`, `POST /user/me/horses/:horseId/skills` (valida SP, requisitos e duplicidade).
- Migração suave: Umas antigas recebem os campos com valor padrão ao serem lidas.

## Critérios de aceite
- Não é possível aprender a mesma skill duas vezes nem sem SP suficiente.
- Skills exigem atributo mínimo (`requirements`).

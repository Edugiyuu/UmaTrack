# Task 22 — Remover os controllers sem rota

| Campo | Valor |
|---|---|
| **ID** | `22` |
| **Branch** | `fix/api-errors` (compartilhada com `20` e `21`) |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | P (< 1 sessão) |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | backend |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
Levantado na task 18. Quatro handlers existem nos controllers mas nenhuma rota os usa:

- `horseController.postHorses` e `patchHorse`: criam e editam éguas do catálogo sem
  autenticação nem validação. O catálogo hoje vem de `backend/src/data/horses.ts`
  (`npm run seed:horses`).
- `userController.update` e `remove`: editam e apagam **qualquer** usuário pelo id do
  path, sem checar se é o dono, e `update` aceita o corpo inteiro (inclusive `monies`,
  `horses` e `password` sem hash).

Hoje não fazem mal, mas bastaria uma linha de rota para abrir um buraco sério.

## 2. Objetivo
Os controllers só têm handlers que alguma rota usa.

## 3. Escopo

### Dentro do escopo
- [ ] Apagar `postHorses`, `patchHorse`, `update` e `remove` (e imports que ficarem sem uso,
      como `mongoose` em `horseController.ts`).
- [ ] Apagar `TRAINING_CONSTANTS` em `userController.ts` e `RACE_CONSTANTS` em
      `raceController.ts` se nada os importar.

### Fora do escopo
- Uma área de admin para editar o catálogo ou contas. Se for preciso, vira task própria,
  com autenticação de admin e validação.

## 4. Abordagem técnica

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/controllers/horseController.ts` | editar | Remove `postHorses`, `patchHorse` |
| `backend/src/controllers/userController.ts` | editar | Remove `update`, `remove` |

## 5. Plano de execução
1. [ ] Conferir com grep que nada importa esses handlers.
2. [ ] Apagar e rodar `tsc` e `docs:check`.

## 6. Critérios de aceite
- [ ] **Dado** um grep por `postHorses|patchHorse|export const update|export const remove` em `backend/src`, **então** não há resultado.
- [ ] `npm run docs:check` continua com 18 operações.

## 7. Como verificar
```bash
cd backend && npx tsc --noEmit
```

```bash
npm run docs:check --prefix backend
```

## 8. Impacto em documentação
- [ ] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Alguém usava `postHorses` por uma rota local não commitada | baixo | O seed substitui; Eduardo confirma. |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npx tsc --noEmit` no backend passa
- [ ] Commit e push na branch da task; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Task criada a partir da seção 9 da task 18. |

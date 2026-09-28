# Task 21 — Corrigir o 404 de `GET /horse/:id`

| Campo | Valor |
|---|---|
| **ID** | `21` |
| **Branch** | `fix/api-errors` (compartilhada com `20` e `22`) |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | P (< 1 sessão) |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | backend |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
Levantado na task 18. Em `backend/src/controllers/horseController.ts`, `getHorse` não dá
`return` depois do 404: segue para `res.status(200).json(horse)`, que lança
`ERR_HTTP_HEADERS_SENT`; o `catch` tenta responder 500 e lança de novo. O cliente recebe
o 404, mas o servidor registra erro não tratado.

Um `id` que não é ObjectId também cai no `catch` (`CastError`) e vira 500, quando o certo
seria 404 (como fazem `findOwnedHorse` e `getTrack`).

## 2. Objetivo
`GET /horse/:id` responde 404 limpo para id inexistente ou inválido, sem erro no log.

## 3. Escopo

### Dentro do escopo
- [ ] `return` no 404.
- [ ] Checar `mongoose.isValidObjectId(id)` antes do `findById` e responder 404.
- [ ] Atualizar a descrição da operação na spec (`backend/src/docs/openapi/paths/horses.ts`):
      tirar o aviso do bug e mover o caso "id inválido" do 500 para o 404.

### Fora do escopo
- Formato `{ error }` → `{ msg }`: task `20`.

## 4. Abordagem técnica

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/controllers/horseController.ts` | editar | `return` + validação do id |
| `backend/src/docs/openapi/paths/horses.ts` | editar | Descrição e respostas |

## 5. Plano de execução
1. [ ] Corrigir o controller.
2. [ ] Atualizar a spec e rodar `npm run docs:check`.

## 6. Critérios de aceite
- [ ] **Dado** um ObjectId que não existe, **então** a resposta é 404 e o log do servidor não mostra `ERR_HTTP_HEADERS_SENT`.
- [ ] **Dado** `GET /horse/abc`, **então** a resposta é 404.

## 7. Como verificar
```bash
cd backend && npx tsc --noEmit
```

- Manual: backend com banco **local**, `GET /horse/000000000000000000000000` e `GET /horse/abc`.

## 8. Impacto em documentação
- [ ] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
N/A — correção local, sem mudança de contrato além do status do id inválido.

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] `npx tsc --noEmit` no backend e `npm run docs:check` passam
- [ ] Commit e push na branch da task; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Task criada a partir da seção 9 da task 18. |

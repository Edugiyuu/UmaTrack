# Task 20 — Padronizar as respostas de erro da API

| Campo | Valor |
|---|---|
| **ID** | `20` |
| **Branch** | `fix/api-errors` (compartilhada com `21` e `22`) |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada |
| **Tamanho** | P (< 1 sessão) |
| **Depende de** | `18` (a spec documenta o comportamento atual) |
| **Bloqueia** | — |
| **Área** | backend · frontend |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
Levantado na task 18 ao documentar a API. A maioria das rotas responde erro como
`{ msg }`, mas `horseController` (`GET /horse`, `GET /horse/:id`) e o `getUser`
(`GET /user/me`, 401 e 404) usam `{ error }`. O frontend só lê `data.msg`
(`frontend/src/services/User.ts` e `Race.ts`), então nesses casos mostra o texto de
fallback em vez da mensagem do servidor.

Além disso, `POST /user/login` responde **422** para usuário inexistente e para senha
errada. 422 é "entrada malformada"; credencial errada costuma ser **401**.

## 2. Objetivo
Toda resposta de erro da API tem o formato `{ msg: string, ...extras }`, e o login decide
conscientemente o status de credencial inválida.

## 3. Escopo

### Dentro do escopo
- [ ] Trocar `{ error }` por `{ msg }` em `horseController.getHorse`, `getAllHorses` e
      `userController.getUser`.
- [ ] Decidir o status do login para credencial inválida (401 recomendado) e, se mudar,
      conferir se o frontend depende do 422 (`frontend/src/services/User.ts`, tela de login).
- [ ] Unificar "Usuário não encontrado" e "Senha inválida" numa mensagem só
      ("E-mail ou senha inválidos"), para não revelar quais e-mails têm conta. Eduardo decide.
- [ ] Atualizar a spec: remover `ErrorLegacy` e os `legacyErrorResponse` de
      `backend/src/docs/openapi/`; ajustar os códigos do login.

### Fora do escopo
- Mensagens `USER_MESSAGES.*` (chaves em vez de texto) em `/user/create`: podem entrar aqui
  se couber, senão viram outra task.

## 4. Abordagem técnica

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/controllers/horseController.ts` | editar | `{ error }` → `{ msg }` |
| `backend/src/controllers/userController.ts` | editar | `getUser` e, se decidido, `login` |
| `backend/src/docs/openapi/**` | editar | Sem `ErrorLegacy`; status do login |
| `frontend/src/services/User.ts` | conferir | Tratamento do erro de login |

## 5. Plano de execução
1. [ ] Trocar o formato nos controllers.
2. [ ] Login: status e mensagem.
3. [ ] Spec + `npm run docs:check` + lint OpenAPI.

## 6. Critérios de aceite
- [ ] **Dado** `GET /horse/<id inexistente>`, **então** o corpo é `{ "msg": "Cavalo não encontrado." }`.
- [ ] **Dado** um grep por `json({ error` em `backend/src/controllers`, **então** não há resultado.
- [ ] **Dado** senha errada no login, **então** o status é o decidido e a tela de login mostra a mensagem do servidor.
- [ ] O schema `ErrorLegacy` não existe mais na spec.

## 7. Como verificar
```bash
cd backend && npx tsc --noEmit
```

```bash
npm run docs:check --prefix backend
```

- Manual: Swagger em `/docs` com banco **local**; login com senha errada no frontend.

## 8. Impacto em documentação
- [ ] `docs/tasks/README.md` (linha da tabela + status)
- [ ] Spec em `backend/src/docs/openapi/`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Algum cliente depende do 422 no login | baixo | Só o frontend do repo consome a API; conferir antes. |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] Build passa: `npm run build --prefix frontend` e `npx tsc --noEmit` no backend
- [ ] `npm run docs:check` passa
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push na branch da task; tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Task criada a partir da seção 9 da task 18. |

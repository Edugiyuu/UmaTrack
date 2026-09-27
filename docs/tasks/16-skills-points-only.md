# Task 16 — Skills custam só skill points

| Campo | Valor |
|---|---|
| **ID** | `16` |
| **Branch** | `feat/skills-points-only` |
| **Base** | `feat/ui-v2-train-race` |
| **Status** | ✅ Concluída (merge em `main` em 2026-09-27) |
| **Tamanho** | P |
| **Depende de** | `15` (só pela pilha de branches; o código é independente) |
| **Bloqueia** | — |
| **Área** | fullstack |
| **Criada em** | 2026-09-27 |

---

## 1. Contexto
Cada skill exigia atributos mínimos (por exemplo *Último Fôlego*: Speed 150, Stamina 120,
Power 90, Wit 90) além do custo em SP. Na prática o jogador juntava os pontos e ainda
assim não podia comprar, e o painel se enchia de "Precisa de Speed, Wit". O Eduardo
decidiu que o único preço de uma skill são os skill points.

## 2. Objetivo
Qualquer égua aprende qualquer skill assim que tiver os SP.

## 3. Escopo

### Dentro do escopo
- [x] Backend: `learnSkill` deixa de checar atributos; só SP e "já aprendida".
- [x] Modelo, catálogo e seed sem o campo `requirements`; o seed remove o campo que
      bancos antigos ainda guardam (`$unset`).
- [x] Frontend: sem os chips de requisito no painel de skills e no catálogo; o aviso de
      bloqueio diz quantos SP faltam.
- [x] Guia do jogador sem a coluna de requisitos.

### Fora do escopo
- Requisitos das **pistas**: continuam como estão (servem ao gerador de rivais e à dica
  do card da pista).
- Rebalancear custos em SP. Se as skills ficarem baratas demais sem o filtro de
  atributo, o ajuste é no `cost` de `backend/src/data/skills.ts`.

## 4. Abordagem técnica

| Arquivo | Ação | O que muda |
|---|---|---|
| `backend/src/controllers/skillController.ts` | editar | Sai a checagem de atributos |
| `backend/src/models/skill.ts` | editar | Sai `requirements` do schema |
| `backend/src/data/skills.ts` | editar | Sai `requirements` do catálogo |
| `backend/src/services/seedSkills.ts` | editar | `$unset: { requirements }` no upsert |
| `frontend/src/types/race.ts` | editar | Sai `requirements` de `SkillResponse` |
| `frontend/src/components/SkillPanel/` | editar | Sem chips; bloqueio só por SP |
| `frontend/src/components/SkillCatalog/` | editar | Sem chips |
| `docs/guia-do-jogador.md` | editar | Seção 5 |

## 5. Critérios de aceite
- [x] **Dado** uma égua com SP suficiente e atributos baixos, **quando** ela aprende uma
      skill, **então** o servidor aceita e desconta os SP.
- [x] **Dado** SP insuficiente, **quando** o jogador olha a skill, **então** o botão está
      desabilitado e o card diz quantos SP faltam.
- [x] **Dado** um banco com skills antigas, **quando** o backend sobe, **então** o seed
      remove o campo `requirements`.

## 6. Como verificar
- `npx tsc --noEmit` no backend e `npm run build --prefix frontend` limpos; `eslint` nos
  arquivos tocados limpo.
- O backend local usa o banco real; a regra foi verificada pela leitura do controller, sem
  aprender skill em save de verdade.

## 7. Definition of Done
- [x] Critérios de aceite marcados
- [x] Build e typecheck passam
- [x] Documentação atualizada
- [x] Commit e push em `feat/skills-points-only`; tabela de status atualizada

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-27 | Pedido do Eduardo depois da task 15. Implementada. |

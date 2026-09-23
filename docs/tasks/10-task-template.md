# Task 10 — Padronizar a documentação de tasks

| Campo | Valor |
|---|---|
| **ID** | `10` |
| **Branch** | `docs/task-template` |
| **Base** | `main` |
| **Status** | 🚧 Em andamento |
| **Tamanho** | P |
| **Depende de** | — |
| **Bloqueia** | `11`, `12`, `13` |
| **Área** | docs |
| **Criada em** | 2026-09-23 |

---

## 1. Contexto
Os arquivos `01`–`09` em `docs/tasks/` registram pouco mais que um título, um escopo em
bullets e, às vezes, critérios de aceite. Não dizem por que a task existe, quais arquivos
são tocados, como verificar o resultado nem o que ficou pendente depois de pronta. Quem
abre a task semanas depois — ou um agente que vai implementá-la — precisa reconstruir o
contexto lendo o código.

## 2. Objetivo
Toda task nova nasce de um template único que cobre contexto, escopo, plano, critérios de
aceite verificáveis e registro de execução.

## 3. Escopo

### Dentro do escopo
- [x] `docs/tasks/TEMPLATE.md` com as seções padrão e instruções de preenchimento.
- [x] `docs/tasks/README.md` com convenções de nome, branch, tamanho e legenda de status.
- [x] Esta task como exemplo preenchido do template.

### Fora do escopo
- Reescrever as tasks `01`–`09` no formato novo. O template vale daqui para frente; as
  antigas já foram entregues e só seriam reescritas por arqueologia.

## 4. Abordagem técnica
Somente Markdown. O template usa instruções em blockquote (`>`) que o autor apaga ao
preencher, e uma tabela de metadados no topo para que status e dependências sejam lidos
sem varrer o texto.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `docs/tasks/TEMPLATE.md` | criar | Template padrão |
| `docs/tasks/README.md` | editar | Convenções, legenda e coluna de tamanho |
| `docs/tasks/10-task-template.md` | criar | Esta task, como exemplo preenchido |

## 5. Plano de execução
1. [x] Escrever o template.
2. [x] Atualizar o README de tasks.
3. [x] Preencher esta task com o próprio template.

## 6. Critérios de aceite
- [x] **Dado** uma task nova, **quando** o autor copia `TEMPLATE.md`, **então** ele tem
  campos para contexto, escopo, plano, aceite, verificação e riscos sem inventar estrutura.
- [x] **Dado** o `README.md` de tasks, **quando** alguém procura o padrão de branch ou o
  significado de um ícone de status, **então** encontra sem abrir outro arquivo.
- [x] O template é demonstrado por pelo menos uma task real preenchida.

## 7. Como verificar
Abrir `docs/tasks/TEMPLATE.md` e `docs/tasks/10-task-template.md` lado a lado: a segunda é
a primeira preenchida, sem seções órfãs.

## 8. Impacto em documentação
- [ ] `README.md` — sem mudança
- [ ] `docs/race-system-design.md` — sem mudança
- [ ] `docs/guia-do-jogador.md` — sem mudança
- [x] `docs/tasks/README.md`

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Template longo demais vira burocracia e ninguém preenche | médio | Seções sem conteúdo podem ser removidas; só metadados, objetivo e aceite são obrigatórios |

## 10. Definition of Done
- [x] Critérios de aceite todos marcados
- [x] Documentação da seção 8 atualizada
- [ ] Commit e push na branch `docs/task-template`

---

## Registro de execução

| Data | Nota |
|---|---|
| 2026-09-23 | Template, README e esta task criados. Tasks 11–13 (frontend, telemetria de corrida) serão escritas com ele. |

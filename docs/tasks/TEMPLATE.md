# Task NN — <Título curto e imperativo>

> **Como usar:** copie este arquivo para `docs/tasks/NN-slug.md`, preencha tudo e apague
> as linhas em citação (`>`), que são instruções. Seções sem conteúdo real devem ser
> removidas ou marcadas com `N/A — motivo`, nunca deixadas vazias.

| Campo | Valor |
|---|---|
| **ID** | `NN` |
| **Branch** | `tipo/slug` — nova, ou reusada de `NN` (ver nota abaixo) |
| **Base** | `main` |
| **Status** | 🔲 Não iniciada · 🚧 Em andamento · 🔍 Em revisão · ✅ Concluída |
| **Tamanho** | P (< 1 sessão) · M (1–2 sessões) · G (quebrar em subtasks) |
| **Depende de** | `NN` / — |
| **Bloqueia** | `NN` / — |
| **Área** | backend · frontend · fullstack · docs |
| **Criada em** | AAAA-MM-DD |

> **Branch nova ou reusada?** Se esta task é parecida com outra ainda aberta (mesma área,
> mesmos arquivos, mesmo tipo de mudança — ex.: "mudar visual dos GIFs" e "mudar visual
> das skills"), continue na branch dela em vez de abrir outra. Escreva `reusa \`tipo/slug\`
> da task NN` no campo **Branch**. Abra uma branch nova quando a task for de outra área,
> puder ser mergeada sozinha, ou a branch existente já tiver sido mergeada na `main`.

---

## 1. Contexto
> Por que esta task existe. O que está quebrado, faltando ou ruim hoje, em 2–5 linhas.
> Se veio de um bug ou de feedback de jogo, descreva o sintoma concreto.

## 2. Objetivo
> Uma frase: o que passa a ser verdade quando a task terminar.

## 3. Escopo

### Dentro do escopo
- [ ] ...

### Fora do escopo
- ... (e para onde vai, se virar outra task)

## 4. Abordagem técnica
> Como resolver. Decisões de design, fórmulas, estrutura de dados, fluxo de tela.
> Diagramas em Mermaid são bem-vindos quando o fluxo não cabe em texto.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `caminho/do/arquivo.ts` | criar / editar / remover | ... |

**Contratos** *(API, tipos compartilhados, props de componente — o que outra parte do código passa a depender)*

```ts
// exemplo: novo campo no replay
```

## 5. Plano de execução
> Passos na ordem em que serão feitos. Cada passo deve caber em um commit.

1. [ ] ...
2. [ ] ...
3. [ ] Atualizar documentação afetada (ver seção 8)

## 6. Critérios de aceite
> Verificáveis por outra pessoa, sem ler o código. Escreva como comportamento observável.

- [ ] **Dado** ... **quando** ... **então** ...
- [ ] ...

## 7. Como verificar
> O caminho exato para provar que funciona: comandos, rota da UI, dados de teste.

```bash
# ex.: npm run dev --prefix backend
```

- Manual: ...
- Automático: ...
- Regressão a observar: ...

## 8. Impacto em documentação
- [ ] `README.md`
- [ ] `docs/race-system-design.md`
- [ ] `docs/guia-do-jogador.md`
- [ ] `docs/tasks/README.md` (linha da tabela + status)

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| ... | baixo/médio/alto | ... |

## 10. Definition of Done
- [ ] Critérios de aceite (seção 6) todos marcados
- [ ] Build passa: `npm run build --prefix frontend` e `npx tsc --noEmit` no backend
- [ ] Sem `console.log` / código morto deixado para trás
- [ ] Documentação da seção 8 atualizada
- [ ] Commit e push na branch da task (própria ou compartilhada); tabela em `docs/tasks/README.md` atualizada

---

## Registro de execução
> Preenchido durante e depois da implementação. É aqui que a task deixa de ser plano e
> vira histórico: o que mudou de rumo, o que ficou pendente.

| Data | Nota |
|---|---|
| AAAA-MM-DD | Início. |

# Task 32 — Deploy do beta aberto (frontend no GitHub Pages, backend no Render)

| Campo | Valor |
|---|---|
| **ID** | `32` |
| **Branch** | `feat/open-beta-deploy` |
| **Base** | `main` |
| **Status** | 🔍 Em revisão |
| **Tamanho** | M |
| **Depende de** | — |
| **Bloqueia** | — |
| **Área** | frontend, backend, infra |
| **Criada em** | 2026-10-16 |

---

## 1. Contexto
O Eduardo acha que o jogo já aguenta um beta aberto. Até aqui ele só rodava na máquina:
frontend no `vite` e backend no `nodemon`, ligado direto ao Atlas.

## 2. Objetivo
Qualquer pessoa joga em `https://edugiyuu.github.io/UmaTrack/`, com a API no Render, e
cada push na `main` publica a parte que mudou.

## 3. Escopo

### Dentro do escopo
- [x] `base` do Vite vindo de `BASE_PATH` (o workflow passa `/UmaTrack/`; local continua `/`).
- [x] URL da API só por `VITE_API_URL` (o `Horse.ts` era o único sem o padrão).
- [x] Os três caminhos de imagem que começavam com `/horses/` agora usam o `BASE_URL`
  (card da home, perfil, pop-up do login).
- [x] Rotas do React no Pages: `404.html` = cópia do `index.html`.
- [x] Workflow `.github/workflows/deploy-frontend.yml`: build e deploy no Pages a cada push
  na `main` que mexe em `frontend/`, ou à mão.
- [x] `render.yaml` (Blueprint): build, start, health check em `/`, variáveis.
- [x] Backend: `npm run build` (tsc) e `npm start`; CORS por `CORS_ORIGINS`; sai com
  erro se o banco não conecta.

### Fora do escopo
- Criar as contas, cadastrar segredos, ligar o Pages e fazer o primeiro deploy: o Eduardo
  faz pelos painéis.
- Domínio próprio, banco separado para o beta, divisão do bundle (o JS tem ~700 kB).
- Tirar o `package-lock.json` do `.gitignore` (o CI usa `npm install` por causa disso).

## 4. Abordagem técnica
- **Banco:** fica no **MongoDB Atlas**, o mesmo cluster e banco de hoje. O backend é
  Mongoose e o Render não tem MongoDB (só Postgres), então Render Postgres pediria
  reescrever a camada de dados. No Atlas o elenco já está semeado e as contas continuam.
  O Atlas precisa liberar `0.0.0.0/0`, porque o Render free não tem IP fixo.
- **Segredos:** já vinham do ambiente (`MONGODB_URI` ou `DB_USER`/`DB_PASS`,
  `SECRET_KEY`). No Render, `MONGODB_URI` é `sync: false` (digitada no painel) e o
  `SECRET_KEY` é gerado pelo próprio Render.
- **Porta:** o `app.ts` já lia `PORT`; o Render define.
- **Build no Render:** com `NODE_ENV=production` o `npm install` pularia as
  devDependencies, e o `tsc` precisa dos `@types`; por isso `--include=dev`.
- **Swagger:** desligado em produção (`API_DOCS=false`), como a task `18` já previa.
- **SPA no Pages:** o `BrowserRouter` já usava `BASE_URL` como `basename`; com o
  `404.html` igual ao `index.html`, link direto para qualquer rota abre a tela certa.
- **`VITE_API_URL`** é variável do repositório (não segredo); o workflow para com erro se
  ela estiver vazia, em vez de publicar um build apontando para `localhost`.

**Arquivos afetados**

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/vite.config.ts` | editar | `base` por `BASE_PATH`. |
| `frontend/src/services/Horse.ts` | editar | Fallback de `VITE_API_URL` igual aos outros services. |
| `frontend/src/components/card/card.tsx` | editar | Imagem com `BASE_URL`. |
| `frontend/src/components/UserProfileMain/UserProfileMain.tsx` | editar | Imagem com `horseAsset`. |
| `frontend/src/components/CreateLoginInput/CreateLoginInput.tsx` | editar | Chibi com `horseAsset`. |
| `.github/workflows/deploy-frontend.yml` | criar | Build e deploy no Pages. |
| `render.yaml` | criar | Blueprint do backend. |
| `backend/package.json` | editar | Scripts `build` e `start`. |
| `backend/src/app.ts` | editar | `CORS_ORIGINS`; `process.exit(1)` sem banco. |
| `backend/.env.example` | editar | `CORS_ORIGINS`. |

## 5. Plano de execução
1. [x] Frontend: `base`, URL da API, caminhos de `public/`.
2. [x] Workflow do Pages com `404.html`.
3. [x] Backend: scripts, CORS, saída sem banco; `render.yaml`.
4. [x] Registro da task.
5. [ ] Eduardo: Atlas (liberar `0.0.0.0/0`), Web Service no Render, Pages e `VITE_API_URL` no GitHub.
6. [ ] Primeiro deploy e jogar uma carreira inteira no site publicado.

## 6. Critérios de aceite
- [x] **Quando** rodo o build com `BASE_PATH=/UmaTrack/` e a URL do Render, **então** o
  `index.html` e os assets saem com o prefixo e o JS aponta para o Render.
- [x] **Quando** abro direto `/UmaTrack/Skills` num servidor que imita o Pages, **então**
  a tela de skills abre e busca `/skill` no backend.
- [x] **Quando** o backend sobe com `NODE_ENV=production` e `PORT=10000`, **então** ele
  escuta na 10000, `GET /` responde e `/docs` dá 404.
- [x] **Quando** a requisição vem de uma origem fora de `CORS_ORIGINS`, **então** a
  resposta não tem `Access-Control-Allow-Origin`.
- [ ] **Quando** faço push na `main`, **então** o Pages e o Render publicam sozinhos.

## 7. Como verificar
- Automático: `npm run build --prefix frontend` e `npm run build --prefix backend`.
- Feito localmente: build de produção do frontend servido em `/UmaTrack/` com fallback
  para `404.html`, contra o backend em modo produção ligado a um MongoDB em memória
  (`mongodb-memory-server`), nunca ao Atlas. Link direto, navegação, música e chamada à
  API funcionaram; CORS conferido com `curl`.
- Depois do deploy: abrir o site, criar conta, treinar e correr.

## 8. Impacto em documentação
- [x] `docs/tasks/README.md` (linha da tabela)
- [x] `docs/guia-do-jogador.md` (onde jogar, espera do primeiro acesso)
- [x] `backend/.env.example` (`CORS_ORIGINS`)
- N/A — `README.md`: nada de regra ou rota mudou.

## 9. Riscos e questões em aberto
| Risco / dúvida | Impacto | Mitigação / quem decide |
|---|---|---|
| Render free hiberna; o primeiro acesso demora 30–60 s | médio | Avisar no anúncio do beta; plano pago se incomodar. |
| Atlas aberto para `0.0.0.0/0` | médio | Senha forte no usuário do banco; IP fixo só em plano pago do Render. |
| Local e beta escrevem no mesmo banco | médio | Eduardo: banco `umasprint-dev` para o local, se quiser separar. |
| Sem `package-lock.json`, o CI resolve versões novas a cada build | baixo | Versionar o lock depois. |
| ~35 MB de mídia (vídeo de fundo e mp3) no site | baixo | Cabe no Pages; recomprimir se o carregamento pesar. |

## 10. Definition of Done
- [x] Critérios de aceite locais (seção 6) marcados
- [x] Build passa: frontend e backend
- [x] Sem `console.log` / código morto deixado para trás
- [x] Documentação da seção 8 atualizada
- [ ] Merge na `main` e push
- [ ] Site e API no ar

---

## Registro de execução
| Data | Nota |
|---|---|
| 2026-10-16 | Configuração de deploy, workflow e `render.yaml` na branch `feat/open-beta-deploy`. Falta o Eduardo configurar os painéis. |

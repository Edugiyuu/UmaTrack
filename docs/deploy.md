# Deploy do beta aberto

O UmaSprint roda em três lugares:

| Parte | Onde | Endereço |
|---|---|---|
| Frontend (Vite + React) | GitHub Pages | `https://edugiyuu.github.io/UmaTrack/` |
| Backend (Express) | Render, plano free | `https://<nome-do-serviço>.onrender.com` |
| Banco (MongoDB) | MongoDB Atlas, o cluster de hoje | `backend.yxyhheq.mongodb.net` |

O workflow [`deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) publica o
frontend a cada push na `main` que mexa em `frontend/`. O Render faz o mesmo com o
backend, seguindo o [`render.yaml`](../render.yaml), quando o push mexe em `backend/`.

## Por que o banco fica no Atlas

O backend usa Mongoose; o Render só oferece Postgres e Key Value, então trocar de banco
seria reescrever toda a camada de dados. O cluster do Atlas que o backend local já usa
continua sendo o banco: o elenco de éguas já está semeado lá, as contas que existem
continuam valendo, e o plano M0 é grátis. Pistas e skills se sincronizam sozinhas quando
o servidor sobe.

Isso quer dizer que **o backend local e o beta escrevem nos mesmos dados**. Se isso
incomodar, aponte o local para outro banco (`MONGODB_URI=.../umasprint-dev`, que nasce
vazio e precisa de `npm run seed:horses`).

## Passo a passo (uma vez)

### 1. MongoDB Atlas

1. **Network Access → Add IP Address → `0.0.0.0/0`.** O Render free não tem IP de saída
   fixo, então o Atlas precisa aceitar qualquer origem. A senha do usuário do banco passa a
   ser a única proteção: use uma forte.
2. **Connect → Drivers** e copie a connection string
   (`mongodb+srv://USUÁRIO:SENHA@backend.yxyhheq.mongodb.net/?retryWrites=true&w=majority&appName=Backend`).
   Sem nome de banco depois da `/`, ela cai no mesmo banco que o local usa hoje.

### 2. Render (backend)

1. Crie a conta e ligue o GitHub, dando acesso ao repositório `UmaTrack`.
2. **New → Blueprint**, escolha o repositório. O Render lê o `render.yaml` e propõe o
   serviço `umasprint-api`.
3. Ele pede as variáveis marcadas `sync: false`. Preencha:

   | Variável | Valor |
   |---|---|
   | `MONGODB_URI` | a connection string do passo 1 |

   As outras já vêm do `render.yaml`:

   | Variável | Valor | Para quê |
   |---|---|---|
   | `NODE_ENV` | `production` | |
   | `NODE_VERSION` | `22` | |
   | `SECRET_KEY` | gerado pelo Render | assina o JWT do login |
   | `CORS_ORIGINS` | `https://edugiyuu.github.io` | só o site do Pages chama a API |
   | `API_DOCS` | `false` | Swagger desligado (o "Try it out" escreve no banco real) |
   | `PORT` | o Render define | o `app.ts` já lê |

4. **Apply.** O primeiro build demora uns minutos. Quando o log mostrar
   `Servidor rodando`, abra a URL do serviço: deve aparecer `Hello, World!`. Anote a URL
   (`https://umasprint-api.onrender.com` ou parecida, se o nome estiver ocupado).

Sem Blueprint, dá para criar à mão um **Web Service** com: Root Directory `backend`,
Build Command `npm install --include=dev && npm run build`, Start Command `npm start`,
Health Check Path `/`, e as variáveis acima.

### 3. GitHub (frontend)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → aba Variables → New repository
   variable**: `VITE_API_URL` = a URL do Render, sem `/` no final. Não é segredo: ela vai
   parar no JavaScript público de qualquer jeito.
3. **Actions → Deploy frontend (GitHub Pages) → Run workflow** (ou um push na `main` que
   mexa em `frontend/`). Sem `VITE_API_URL` o workflow para com um erro dizendo isso.
4. Abra `https://edugiyuu.github.io/UmaTrack/`.

### Trocar a URL do backend depois

Mude a variável `VITE_API_URL` no GitHub e rode o workflow de novo. O Vite grava a URL no
build, então mudar só a variável não basta.

Se o site sair do `edugiyuu.github.io` (domínio próprio, fork), atualize `CORS_ORIGINS`
no Render: só origem, sem caminho (`https://exemplo.com`, não `.../UmaTrack/`). Várias
origens vão separadas por vírgula.

## Como funciona

- **Subcaminho.** O Pages serve o site em `/UmaTrack/`. O workflow passa
  `BASE_PATH=/UmaTrack/` (o nome do repositório) e o `vite.config.ts` usa como `base`.
  O `BrowserRouter` usa `import.meta.env.BASE_URL` como `basename`, e os arquivos de
  `public/` são montados com o mesmo prefixo (`horseAsset`, `bgMusic`, …). Caminho
  começando com `/horses/...` quebra no Pages: use `import.meta.env.BASE_URL`.
- **Rotas do React no Pages.** O Pages não sabe reescrever `/UmaTrack/Race/123` para o
  `index.html`. O workflow copia o `index.html` para `404.html`; o Pages devolve esse
  arquivo para qualquer caminho desconhecido e o React Router desenha a rota. Os links
  diretos funcionam (o navegador só registra o status 404 no console).
- **CORS.** Com `CORS_ORIGINS`, o backend só responde a essas origens; sem ela, a
  qualquer uma, como no desenvolvimento.
- **Banco caído.** Se a conexão com o banco falha, o servidor sai com erro em vez de ficar
  de pé sem escutar; o Render reinicia e o health check não passa até conectar.

## Limites do plano free do Render

- **Hiberna depois de 15 minutos sem requisição.** A próxima chamada acorda o servidor e
  demora **30 a 60 segundos**: o primeiro login ou a primeira lista de éguas do dia parece
  travada. As seguintes são normais. Vale avisar os testadores do beta.
- 750 horas por mês por conta, o que cobre um serviço ligado o mês inteiro.
- Os logs ficam no painel do Render (aba **Logs**).

## Testar a configuração de produção na máquina

```bash
cd frontend && BASE_PATH=/UmaTrack/ VITE_API_URL=https://umasprint-api.onrender.com npm run build
```

No Git Bash do Windows, prefixe com `MSYS_NO_PATHCONV=1`, senão ele troca `/UmaTrack/` por
um caminho do Windows.

```bash
cd backend && npm run build && NODE_ENV=production PORT=10000 MONGODB_URI=mongodb://127.0.0.1:27017/teste SECRET_KEY=teste CORS_ORIGINS=http://localhost:4173 npm start
```

Use um MongoDB local ou descartável no `MONGODB_URI`: o `backend/.env` aponta para o banco
de verdade.

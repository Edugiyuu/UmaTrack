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

Crie a conta no Render e ligue o GitHub, dando acesso ao repositório `UmaTrack`. Depois
siga a opção A (tudo à mão no painel) ou a B (o Render lê o `render.yaml` e preenche
sozinho). O resultado é o mesmo.

#### Opção A: Web Service à mão

1. **New → Web Service** e escolha o repositório `UmaTrack`.
2. Preencha a tela de criação:

   | Campo | Valor |
   |---|---|
   | **Name** | `umasprint-api` (vira parte da URL) |
   | **Language** | `Node` |
   | **Branch** | `main` |
   | **Region** | a mais perto do cluster do Atlas (veja a região no Atlas; na dúvida, `Virginia (US East)`) |
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install --include=dev && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

   O `--include=dev` é obrigatório: com `NODE_ENV=production` o npm pula as
   devDependencies, e o `tsc` precisa dos `@types` que estão nelas.

3. Em **Environment Variables**, clique em **Add Environment Variable** para cada uma:

   | Key | Value | Para quê |
   |---|---|---|
   | `NODE_VERSION` | `22` | mesma versão do Node usada aqui |
   | `NODE_ENV` | `production` | modo produção |
   | `MONGODB_URI` | a connection string do passo 1 | banco |
   | `SECRET_KEY` | um texto aleatório e longo (veja abaixo) | assina o JWT do login |
   | `CORS_ORIGINS` | `https://edugiyuu.github.io` | só o site do Pages chama a API |
   | `API_DOCS` | `false` | Swagger desligado (o "Try it out" escreve no banco real) |

   **Não crie `PORT`**: o Render define sozinho e o `app.ts` já lê. Para gerar o
   `SECRET_KEY`, rode na sua máquina e cole o resultado:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Não precisa ser o mesmo do `backend/.env`; trocar só desloga quem estiver logado.

4. Abra **Advanced** (no fim da página):

   | Campo | Valor |
   |---|---|
   | **Health Check Path** | `/` |
   | **Auto-Deploy** | `On Commit` (cada push na `main` que mexe em `backend/` publica de novo) |

5. **Deploy Web Service.** O primeiro build demora uns minutos. Quando o log mostrar
   `Conectou ao banco!` e depois `Servidor rodando`, abra a URL do serviço (no alto da
   página, `https://umasprint-api.onrender.com` ou parecida se o nome estiver ocupado):
   deve aparecer `Hello, World!`. Anote essa URL para o passo 3.

Se o log parar em `Erro ao conectar ao banco`, quase sempre é o Atlas bloqueando o IP
(passo 1.1) ou usuário/senha errados no `MONGODB_URI`.

#### Opção B: Blueprint (`render.yaml`)

O [`render.yaml`](../render.yaml) já tem todos os campos da opção A. **New → Blueprint**,
escolha o repositório, e o Render cria o serviço `umasprint-api` com eles. Ele só pede o
`MONGODB_URI`; o `SECRET_KEY` ele gera sozinho. Clique em **Apply** e confira o log como
no passo 5 acima.

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

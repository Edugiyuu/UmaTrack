# Project Map

## Purpose
UmaSprint: jogo web de carreira de éguas de corrida (inspirado em Uma Musume). O jogador compra uma égua, treina em turnos e corre provas contra rivais.

## Requirements
- Toda regra que altera o save (treino, descanso, compra, corrida) roda no servidor; o navegador só exibe/anima (docs/visao-geral.md).
- Rivais 0,9–1,3× a égua: carreiras difíceis de propósito.
- Animações de UI em GSAP.

## Components (implemented, verified in repo)
- Frontend: React 19 + Vite + TS, MUI, GSAP, react-router 7, axios. `frontend/src/`
  - Rotas: `routes/AppRoutes.tsx`; páginas em `pages/`; telas em `components/` (Stable, CareerMenu, RaceTrackSelect, RaceRunner…)
  - Chamadas HTTP: `services/User.ts`, `Horse.ts`, `Race.ts`; token em `services/authToken.ts` (cookie via universal-cookie)
  - Animações: `animations/` (hooks GSAP)
- Backend: Express 5 + TS + Mongoose. `backend/src/`
  - Entrada `app.ts` (conecta Mongo, semeia pistas/skills, sobe servidor)
  - `routes/` → `controllers/` → `services/` (raceEngine, rivalGenerator, trainingEngine, career, ownedHorse)
  - `models/` (user, horse, skill, track, raceResult); `data/` (dados de catálogo/seed)
  - `middleware/authMiddleware.ts` (JWT Bearer), `encryptPassword.ts` (bcrypt)
  - `docs/` OpenAPI + Swagger UI em /docs
  - `scripts/*Check.ts`: verificações manuais do motor (sem framework de testes)

## Main Flow
Navegador (React) --axios JSON + "Authorization: Bearer <jwt>"--> Express routes
  --> controller --> services (regras / motor de corrida com seed) --> Mongoose --> MongoDB Atlas
Corrida: POST /race/run (égua, pista, estratégia) -> servidor simula -> devolve replay -> frontend anima com GSAP.

## Data and Trust Boundaries
- MongoDB (Atlas por padrão; MONGODB_URI sobrescreve). Coleções: users (éguas do usuário embutidas em users.horses), horses (catálogo), tracks, skills, raceresults.
- Auth: JWT HS256 assinado com SECRET_KEY; middleware valida id/userName.
- Fronteira de confiança: navegador não decide resultados; o servidor calcula.

## Build and Deployment
- `.claude/launch.json`: frontend (npm run dev, 5173, VITE_API_URL=http://localhost:3001), backend (npm run dev, PORT 3001).
- Backend scripts: dev, race:check, training:check, career:check, seed:horses, docs:check.
- Frontend: dev, build, lint, preview.
- Deploy: não verificado.

## Unknowns
- Configuração de deploy/hospedagem.
- Detalhes internos do motor de corrida e do treino ainda não estudados juntos.

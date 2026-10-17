import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import routes from "./routes";
import { ensureTracksSeeded } from "./services/seedTracks";
import { ensureSkillsSeeded } from "./services/seedSkills";
import { mountApiDocs } from "./docs/swagger";

// CORS_ORIGINS lists the sites allowed to call the API, comma-separated (in production,
// the GitHub Pages origin). Unset, any origin may call it, as in development.
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);

const app = express();
app.use(express.json());
app.use(cors(corsOrigins?.length ? { origin: corsOrigins } : undefined));
mountApiDocs(app);
app.use(routes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const port = Number(process.env.PORT) || 3000;

// MONGODB_URI wins so the app can be pointed at a local server; without it we keep
// building the Atlas URL from the credentials the way it always did.
const mongoUri =
  process.env.MONGODB_URI ??
  `mongodb+srv://${dbUser}:${dbPassword}@backend.yxyhheq.mongodb.net/?retryWrites=true&w=majority&appName=Backend`;

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Conectou ao banco!');
    return Promise.all([ensureTracksSeeded(), ensureSkillsSeeded()]);
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando em: http://localhost:${port}`);
    });
  })
  .catch((err: any) => {
    console.error('Erro ao conectar ao banco:', err);
    // Without a database the server never listens; exit so the host (Render) restarts it.
    process.exit(1);
  });
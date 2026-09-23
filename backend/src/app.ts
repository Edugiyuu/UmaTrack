import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import routes from "./routes";
import { ensureTracksSeeded } from "./services/seedTracks";
import { ensureSkillsSeeded } from "./services/seedSkills";

const app = express();
app.use(express.json());
app.use(cors());
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
  });
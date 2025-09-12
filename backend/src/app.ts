import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import routes from "./routes";

const app = express();
app.use(express.json());
app.use(cors());
app.use(routes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@backend.yxyhheq.mongodb.net/?retryWrites=true&w=majority&appName=Backend`)
  .then(() => {
    console.log('Conectou ao banco!');
    app.listen(3000, () => {
      console.log('Servidor rodando em: http://localhost:3000');
    });
  })
  .catch((err: any) => {
    console.error('Erro ao conectar ao banco:', err);
  });
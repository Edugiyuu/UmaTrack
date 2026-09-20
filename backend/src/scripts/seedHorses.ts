/**
 * Bootstraps an EMPTY database with the starting roster:
 *
 *   npm run seed:horses
 *
 * It upserts by name, so running it against a database that already has these horse
 * girls will reset their catalogue stats back to the values in `data/horses.ts`.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { ensureHorsesSeeded } from "../services/seedHorses";

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const mongoUri =
  process.env.MONGODB_URI ??
  `mongodb+srv://${dbUser}:${dbPassword}@backend.yxyhheq.mongodb.net/?retryWrites=true&w=majority&appName=Backend`;

mongoose
  .connect(mongoUri)
  .then(ensureHorsesSeeded)
  .then(() => mongoose.disconnect())
  .catch((error: unknown) => {
    console.error("Erro ao popular cavalos:", error);
    process.exitCode = 1;
    return mongoose.disconnect();
  });

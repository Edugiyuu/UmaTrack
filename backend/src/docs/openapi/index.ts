import type { OpenAPIV3_1 } from "openapi-types";
import { schemas } from "./schemas";
import { examples, responses } from "./responses";
import { systemPaths } from "./paths/system";
import { authPaths } from "./paths/auth";
import { userPaths } from "./paths/user";
import { horsePaths } from "./paths/horses";
import { ownedHorsePaths, parameters } from "./paths/ownedHorse";
import { trackPaths } from "./paths/tracks";
import { skillPaths } from "./paths/skills";
import { racePaths } from "./paths/races";

const DESCRIPTION = `
API do UmaSprint: cadastro, loja de éguas, treino, carreira, skills e corridas simuladas no servidor.

**⚠️ "Try it out" escreve no banco para onde o backend aponta.** Sem \`MONGODB_URI\` ele conecta no
Atlas de verdade, e treinar ou correr por aqui altera saves reais. Rode com um MongoDB local.

**Autenticação:** faça \`POST /user/login\`, copie o \`token\` e cole em **Authorize**. Ele expira em 1 hora.

**Erros:** quase todas as rotas respondem \`{ "msg": string }\` (schema \`Error\`). As rotas marcadas com ⚠️
usam o formato antigo \`{ "error": string }\` (schema \`ErrorLegacy\`).

**Unidades do motor de corrida:** tempo em turnos, distância em metros, velocidade em m/turno.
Regras do jogo: \`docs/UmaSprint-Mecanicas-do-Jogo.pdf\`; design: \`docs/race-system-design.md\`.
`.trim();

const tags: OpenAPIV3_1.TagObject[] = [
  { name: "Sistema", description: "Saúde do servidor." },
  { name: "Auth", description: "Cadastro, login e validação do token." },
  { name: "Usuário", description: "Perfil e loja de éguas." },
  { name: "Catálogo de éguas", description: "Éguas à venda." },
  { name: "Égua do usuário", description: "A cópia da égua no save do usuário." },
  { name: "Treino e carreira", description: "Os turnos da carreira: treinar, descansar, recomeçar." },
  { name: "Skills", description: "Catálogo de skills e compra com skill points." },
  { name: "Pistas", description: "Catálogo de pistas." },
  { name: "Corrida", description: "Simulação de corrida e histórico." }
];

/** The whole OpenAPI document. Built on demand so `servers` follows the environment. */
export const buildOpenApiDocument = (): OpenAPIV3_1.Document => ({
  openapi: "3.1.0",
  info: {
    title: "UmaSprint API",
    version: "1.0.0",
    description: DESCRIPTION,
    license: { name: "ISC", identifier: "ISC" }
  },
  servers: [{ url: process.env.PUBLIC_API_URL ?? "http://localhost:3000" }],
  tags,
  // See `Paths` in responses.ts for why this cast is needed.
  paths: {
    ...systemPaths,
    ...authPaths,
    ...userPaths,
    ...horsePaths,
    ...ownedHorsePaths,
    ...skillPaths,
    ...trackPaths,
    ...racePaths
  } as unknown as OpenAPIV3_1.PathsObject,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token de `POST /user/login`. HS256, expira em 1 hora. Payload: `{ id, userName }`."
      }
    },
    schemas,
    responses,
    parameters,
    examples
  }
});

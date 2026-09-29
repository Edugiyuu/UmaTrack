import type { Express } from "express";
import { buildOpenApiDocument } from "./openapi";

type SwaggerUi = typeof import("swagger-ui-express");

/**
 * swagger-ui-express is a devDependency, so an install with `--omit=dev` does not have
 * it. Load it lazily and leave the docs off instead of crashing the server.
 */
const loadSwaggerUi = (): SwaggerUi | null => {
  try {
    return require("swagger-ui-express") as SwaggerUi;
  } catch {
    return null;
  }
};

/**
 * API_DOCS=true or false forces the docs on or off. Unset, they are on except when
 * NODE_ENV=production: "Try it out" writes to whatever database the server uses.
 */
export const apiDocsEnabled = () => {
  const flag = process.env.API_DOCS?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
};

/** Serves the Swagger UI at /docs and the raw spec at /openapi.json. */
export const mountApiDocs = (app: Express) => {
  if (!apiDocsEnabled()) return;

  const swaggerUi = loadSwaggerUi();
  if (!swaggerUi) {
    console.warn("API docs desligadas: swagger-ui-express não está instalado (é devDependency).");
    return;
  }

  const document = buildOpenApiDocument();
  app.get("/openapi.json", (_req, res) => {
    res.json(document);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: "UmaSprint API",
      swaggerOptions: { persistAuthorization: true }
    })
  );
};

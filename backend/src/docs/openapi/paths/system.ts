import { type Paths, open } from "../responses";

export const systemPaths: Paths = {
  "/": {
    get: open({
      tags: ["Sistema"],
      summary: "Health check",
      description: "Responde texto puro, não JSON. Serve como ping para saber se o servidor está de pé.",
      operationId: "healthCheck",
      responses: {
        "200": {
          description: "Servidor no ar.",
          content: { "text/plain": { schema: { type: "string" }, example: "Hello, World!" } }
        }
      }
    })
  }
};

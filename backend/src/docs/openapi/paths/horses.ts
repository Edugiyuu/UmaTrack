import { ref } from "../schemas";
import { type Paths, jsonResponse, legacyErrorResponse, open } from "../responses";
import { catalogHorseExample, IDS } from "../examples";

export const horsePaths: Paths = {
  "/horse": {
    get: open({
      tags: ["Catálogo de éguas"],
      summary: "Listar o catálogo de éguas",
      description: "Éguas à venda na loja. `passiveBuff` é só texto de loja: nenhum código aplica esse bônus.",
      operationId: "listHorses",
      responses: {
        "200": jsonResponse("Catálogo.", { type: "array", items: ref("Horse") }, {
          catalog: { summary: "Catálogo (recortado)", value: [catalogHorseExample] }
        }),
        "500": legacyErrorResponse("Erro ao ler o catálogo.", "Erro interno.")
      }
    })
  },

  "/horse/{id}": {
    get: open({
      tags: ["Catálogo de éguas"],
      summary: "Uma égua do catálogo",
      description:
        "⚠️ O controller não dá `return` depois do 404: o cliente recebe o 404, mas o servidor ainda tenta " +
        "responder 200 e registra `ERR_HTTP_HEADERS_SENT`. Um `id` que não é ObjectId cai no `catch` e " +
        "responde 500.",
      operationId: "getHorse",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Id da égua no catálogo.",
          schema: ref("ObjectId"),
          example: IDS.horse
        }
      ],
      responses: {
        "200": jsonResponse("A égua.", ref("Horse"), { horse: { summary: catalogHorseExample.name, value: catalogHorseExample } }),
        "404": legacyErrorResponse("Nenhuma égua com esse id.", "Cavalo não encontrado."),
        "500": legacyErrorResponse("Erro de banco, inclusive `id` que não é ObjectId (`CastError`).", "Erro interno.")
      }
    })
  }
};


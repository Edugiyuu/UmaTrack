import { ref } from "../schemas";
import { type Paths, errorResponse, jsonResponse, open } from "../responses";
import { IDS, trackExample } from "../examples";

export const trackPaths: Paths = {
  "/track": {
    get: open({
      tags: ["Pistas"],
      summary: "Listar as pistas",
      description:
        "Catálogo de pistas, ordenado por `difficulty` e depois `distance`. Cada pista traz os virtuais `id` " +
        "e `maxGrade`. `statWeights` e `grade` são legado: o motor por turnos não os usa.",
      operationId: "listTracks",
      responses: {
        "200": jsonResponse("Pistas.", { type: "array", items: ref("Track") }, {
          tracks: { summary: "Catálogo (recortado)", value: [trackExample] }
        }),
        "500": errorResponse("Erro ao ler o catálogo.", "Erro ao buscar pistas.")
      }
    })
  },

  "/track/{id}": {
    get: open({
      tags: ["Pistas"],
      summary: "Uma pista",
      description: "Aceita o ObjectId ou o `slug` da pista.",
      operationId: "getTrack",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ObjectId ou slug da pista.",
          schema: { type: "string" },
          examples: {
            slug: { summary: "Slug", value: "niigata-mile" },
            objectId: { summary: "ObjectId", value: IDS.track }
          }
        }
      ],
      responses: {
        "200": jsonResponse("A pista.", ref("Track"), { track: { summary: trackExample.name, value: trackExample } }),
        "404": errorResponse("Nenhuma pista com esse id ou slug.", "Pista não encontrada."),
        "500": errorResponse("Erro de banco.", "Erro ao buscar pista.")
      }
    })
  }
};

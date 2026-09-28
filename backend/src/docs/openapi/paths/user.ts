import { ref } from "../schemas";
import { type Paths, errorResponse, jsonResponse, legacyErrorResponse, protectedServerError, secured } from "../responses";
import { catalogHorseExample, IDS, userExample, userProfileExample } from "../examples";

export const userPaths: Paths = {
  "/user/me": {
    get: secured({
      tags: ["Usuário"],
      summary: "Perfil do usuário",
      description:
        "O usuário do token, **sem** `password`, com todas as cópias de éguas (inclusive aposentadas). " +
        "Cada cópia vem com `career` já como `CareerView`.\n\n" +
        "**Atenção:** aqui `horses[]._id` é o id da **cópia**. Nas rotas `/user/me/horses/{horseId}` o " +
        "`horseId` é o id do **catálogo** (`horses[].sourceHorseId`).",
      operationId: "getMe",
      responses: {
        "200": jsonResponse("Perfil.", ref("UserProfile"), {
          profile: { summary: "Usuário com uma égua em carreira", value: userProfileExample }
        }),
        "404": legacyErrorResponse("Usuário do token não existe mais.", "USER_MESSAGES.USER_NOT_FOUND"),
        "500": protectedServerError("USER_MESSAGES.ERROR_GETTING_USER")
      }
    })
  },

  "/user/me/purchase-horse": {
    post: secured({
      tags: ["Usuário"],
      summary: "Comprar égua",
      description:
        "Desconta o preço (`cost` do catálogo) e cria a cópia com a carreira nova, numa operação atômica " +
        "(`findOneAndUpdate` com `monies >= cost` e sem cópia com o mesmo id de catálogo ou nome). " +
        "Não dá para comprar de novo uma égua que já tem, nem aposentada: para correr com ela de novo " +
        "use `POST /user/me/horses/{horseId}/new-career`.",
      operationId: "purchaseHorse",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["horseId"],
              properties: { horseId: { ...ref("ObjectId"), description: "Id da égua no catálogo." } }
            },
            example: { horseId: IDS.horse }
          }
        }
      },
      responses: {
        "200": jsonResponse(
          "Comprou. `user` vem com as carreiras cruas (`StoredCareer`).",
          {
            type: "object",
            required: ["msg", "user", "purchasedHorse"],
            properties: {
              msg: { type: "string", const: "Cavalo comprado com sucesso!" },
              user: ref("User"),
              purchasedHorse: { ...ref("Horse"), description: "A égua do catálogo que foi comprada." }
            }
          },
          {
            bought: {
              summary: "Compra feita",
              value: {
                msg: "Cavalo comprado com sucesso!",
                user: { ...userExample, monies: 600 },
                purchasedHorse: catalogHorseExample
              }
            }
          }
        ),
        "400": errorResponse("Dinheiro insuficiente.", {
          summary: "Dinheiro insuficiente",
          value: { msg: "Dinheiro insuficiente", required: catalogHorseExample.cost, available: 1000 }
        }),
        "404": errorResponse("Égua ou usuário não encontrado.", "Cavalo não encontrado", "Usuário não encontrado"),
        "409": errorResponse("Ela já está no save (inclusive aposentada).", "Cavalo já pertence ao usuário"),
        "422": errorResponse(
          "`horseId` ausente ou não é ObjectId; ou a égua tem preço inválido no catálogo.",
          "Horse ID é obrigatório",
          "Preço do cavalo inválido"
        ),
        "500": protectedServerError("Erro interno do servidor")
      }
    })
  }
};

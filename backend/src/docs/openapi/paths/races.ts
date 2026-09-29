import { ref, RUNNING_STYLE_ENUM } from "../schemas";
import { type Paths, errorResponse, jsonResponse, protectedServerError, secured } from "../responses";
import { careerOutcomeExamples, IDS, raceResultExample, raceRunExample } from "../examples";

export const racePaths: Paths = {
  "/race/run": {
    post: secured({
      tags: ["Corrida"],
      summary: "Correr",
      description:
        "Simula a corrida no servidor (motor por turnos) contra `fieldSize - 1` adversárias, das quais 3 são " +
        "rivais montadas sobre os atributos da égua do jogador. Devolve o replay completo, que **não** é gravado.\n\n" +
        "**Pré-condições, na ordem em que o controller checa** (o primeiro erro encontrado é o que sai):\n" +
        "1. 422 `Cavalo e pista são obrigatórios`\n" +
        "2. 422 `Estilo de corrida inválido`\n" +
        "3. 404 `Pista não encontrada`\n" +
        "4. 404 `Cavalo não pertence ao usuário`\n" +
        "5. 409 carreira terminada\n" +
        "6. 409 com 0 turnos, qualquer pista que não seja a da prova da carreira (traz `trackSlug`)\n" +
        "7. 409 energia abaixo de 35\n" +
        "8. 400 dinheiro abaixo da inscrição (a prova da carreira não cobra inscrição)\n\n" +
        "**Efeitos colaterais:** desconta 35 de energia e a inscrição; paga o prêmio; soma skill points e fãs; " +
        "numa prova avulsa consome 1 turno, na prova da " +
        "carreira avança o calendário ou encerra a carreira (`rewards.career`); grava um `RaceResult` no histórico. " +
        "Se `runningStyle` vier, ele é gravado na égua.",
      operationId: "runRace",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["horseId", "trackId"],
              properties: {
                horseId: { ...ref("ObjectId"), description: "Id da égua no **catálogo**." },
                trackId: { type: "string", description: "ObjectId ou slug da pista." },
                runningStyle: {
                  type: "string",
                  enum: RUNNING_STYLE_ENUM,
                  description: "Opcional. Se vier, é gravado na égua. **Hoje não afeta a simulação.**"
                }
              }
            },
            examples: {
              slug: { summary: "Pista por slug", value: { horseId: IDS.horse, trackId: "niigata-mile", runningStyle: "front" } },
              objectId: { summary: "Pista por ObjectId", value: { horseId: IDS.horse, trackId: IDS.track } }
            }
          }
        }
      },
      responses: {
        "200": jsonResponse("Corrida simulada e prêmios aplicados.", ref("RaceRunResponse"), {
          optional: {
            summary: "Prova avulsa, 2º lugar (seed 20260927, replay recortado)",
            value: raceRunExample
          },
          career: {
            summary: "Prova da carreira cumprida",
            value: {
              ...raceRunExample,
              rewards: {
                ...raceRunExample.rewards,
                entryFee: 0,
                turnsLeft: careerOutcomeExamples.passed.next.turnsBefore,
                career: careerOutcomeExamples.passed
              }
            }
          }
        }),
        "400": errorResponse("Sem dinheiro para a inscrição.", {
          summary: "Dinheiro insuficiente para a inscrição",
          value: { msg: "Dinheiro insuficiente para a inscrição", required: 120, available: 80 }
        }),
        "404": errorResponse("Pista ou égua não encontrada.", "Pista não encontrada", "Cavalo não pertence ao usuário"),
        "409": errorResponse(
          "Carreira terminada, prova da carreira obrigatória, ou energia insuficiente.",
          "A carreira dela terminou. Comece uma nova carreira para correr.",
          {
            summary: "Os turnos acabaram: só a prova da carreira",
            value: { msg: "Os turnos acabaram: agora é a prova da carreira, Niigata Mile.", trackSlug: "niigata-mile" }
          },
          {
            summary: "Energia insuficiente",
            value: { msg: "Energia insuficiente para correr. Descanse antes da prova.", required: 35, available: 20 }
          }
        ),
        "422": errorResponse(
          "Campo obrigatório ausente ou estilo fora do enum.",
          "Cavalo e pista são obrigatórios",
          "Estilo de corrida inválido"
        ),
        "500": protectedServerError("Erro ao simular corrida")
      }
    })
  },

  "/user/me/races": {
    get: secured({
      tags: ["Corrida"],
      summary: "Histórico de corridas",
      description:
        "Corridas do usuário, mais recentes primeiro. `limit` e `skip` inválidos caem no padrão em vez de dar erro. " +
        "`finishTime` está na unidade de `timeUnit`: `turns` no motor atual, `seconds` nas corridas antigas.",
      operationId: "getRaceHistory",
      parameters: [
        {
          name: "limit",
          in: "query",
          required: false,
          description: "Itens por página (limitado a 1–50).",
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 }
        },
        {
          name: "skip",
          in: "query",
          required: false,
          description: "Itens a pular.",
          schema: { type: "integer", minimum: 0, default: 0 }
        }
      ],
      responses: {
        "200": jsonResponse("Página do histórico.", ref("RaceHistory"), {
          page: { summary: "Primeira página", value: { races: [raceResultExample], total: 1, limit: 20, skip: 0 } }
        }),
        "500": protectedServerError("Erro ao buscar histórico de corridas")
      }
    })
  }
};

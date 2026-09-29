import type { OpenAPIV3_1 } from "openapi-types";
import { ref, TRAIN_TYPE_ENUM } from "../schemas";
import { type Paths, errorResponse, jsonResponse, protectedServerError, secured } from "../responses";
import { IDS, ownedHorseExample, restExample, skillExample, trainingExample } from "../examples";

const horseIdParam: OpenAPIV3_1.ReferenceObject = { $ref: "#/components/parameters/HorseId" };

export const parameters: Record<string, OpenAPIV3_1.ParameterObject> = {
  HorseId: {
    name: "horseId",
    in: "path",
    required: true,
    description:
      "Id da égua no **catálogo** (não o da cópia). Com várias cópias vale a da carreira ativa; sem ativa, " +
      "a aposentada mais recente. Um valor que não é ObjectId responde 404.",
    schema: ref("ObjectId"),
    example: IDS.horse
  }
};

const notOwned = errorResponse("A égua não existe no catálogo ou não está no save do usuário.", "Cavalo não pertence ao usuário");
const ownedHorseResponse: OpenAPIV3_1.SchemaObject = { type: "object", required: ["horse"], properties: { horse: ref("OwnedHorse") } };

export const ownedHorsePaths: Paths = {
  "/user/me/horses/{horseId}": {
    get: secured({
      tags: ["Égua do usuário"],
      summary: "Égua do usuário",
      description:
        "A cópia da égua no save, com a carreira como `CareerView`. Aqui `_id` é o id do catálogo e " +
        "`ownedHorseId` o da cópia.\n\n" +
        "**Efeito colateral:** éguas antigas sem os campos novos são completadas e salvas na primeira " +
        "leitura (`normalizeOwnedHorse`). Este GET pode escrever no banco.",
      operationId: "getOwnedHorse",
      parameters: [horseIdParam],
      responses: {
        "200": jsonResponse("A égua.", ref("OwnedHorse"), { horse: { summary: "Égua em carreira", value: ownedHorseExample } }),
        "404": notOwned,
        "500": protectedServerError("Erro ao buscar cavalo do usuário")
      }
    })
  },

  "/user/me/horses/{horseId}/train": {
    post: secured({
      tags: ["Treino e carreira"],
      summary: "Treinar",
      description:
        "Converte a pontuação do minigame em pontos de atributo e skill points. **A pontuação é o único dado " +
        "confiado ao cliente**; todo o resto é calculado no servidor (`resolveTraining`):\n\n" +
        "`ganho = round(base × desempenho × afinidade × energia × retorno decrescente × sorteio)`, " +
        "mínimo 1. Base 10,08 (speed, stamina), 8,96 (power), 7,84 (wit); desempenho `0,25 + 0,75 × (score/maxScore)^1,15`. " +
        "Skill points: `max(1, round(ganho × 0,45))`, +8 num round perfeito. Energia abaixo de 25 pode fazer " +
        "o treino fracassar. Detalhes no PDF `docs/UmaSprint-Mecanicas-do-Jogo.pdf`.\n\n" +
        "Gasta 20 de energia e 1 turno. Com 0 turnos a prova da carreira é obrigatória e treinar é recusado.",
      operationId: "trainHorse",
      parameters: [horseIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["trainType"],
              description: "`score` é obrigatório (ou o nome antigo `points`).",
              properties: {
                trainType: { type: "string", enum: TRAIN_TYPE_ENUM, description: "Atributo treinado." },
                score: { type: "number", minimum: 0, description: "Pontuação no minigame, de 0 a `maxScore`." },
                maxScore: {
                  type: "number",
                  exclusiveMinimum: 0,
                  maximum: 50,
                  default: 10,
                  description: "Pontuação máxima possível no minigame."
                },
                points: { type: "number", minimum: 0, deprecated: true, description: "Nome antigo de `score`." }
              }
            },
            example: { trainType: "stamina", score: 10, maxScore: 10 }
          }
        }
      },
      responses: {
        "200": jsonResponse(
          "Treino feito. `horse` já vem com o ganho, a energia e o turno atualizados.",
          {
            type: "object",
            required: ["horse", "training"],
            properties: { horse: ref("OwnedHorse"), training: ref("TrainingOutcome") }
          },
          {
            perfect: {
              summary: "Round perfeito de stamina",
              value: {
                horse: {
                  ...ownedHorseExample,
                  stamina: ownedHorseExample.stamina + trainingExample.statGain,
                  skillPoints: ownedHorseExample.skillPoints + trainingExample.skillPointsGained,
                  energy: ownedHorseExample.energy - trainingExample.energySpent,
                  turnsLeft: ownedHorseExample.turnsLeft - 1
                },
                training: trainingExample
              }
            }
          }
        ),
        "404": notOwned,
        "409": errorResponse(
          "Aposentada, ou sem turnos (hora da prova da carreira).",
          "A carreira dela terminou.",
          "Os turnos acabaram: agora é a prova da carreira."
        ),
        "422": errorResponse(
          "`trainType` fora do enum, ou pontuação ausente / negativa / acima de `maxScore`, ou `maxScore` fora de (0, 50].",
          "Tipo de treino inválido",
          "Pontuação de treino inválida"
        ),
        "500": protectedServerError("Erro ao salvar treino")
      }
    })
  },

  "/user/me/horses/{horseId}/rest": {
    post: secured({
      tags: ["Treino e carreira"],
      summary: "Descansar",
      description:
        "Devolve 45 de energia (até 100), gastando 1 turno. Com 0 turnos descansar " +
        "continua permitido e **não gasta turno** (`turnSpent: false`), para a égua não travar sem energia " +
        "para a prova obrigatória.",
      operationId: "restHorse",
      parameters: [horseIdParam],
      responses: {
        "200": jsonResponse(
          "Descansou.",
          {
            type: "object",
            required: ["horse", "rest"],
            properties: { horse: ref("OwnedHorse"), rest: ref("RestOutcome") }
          },
          {
            rested: {
              summary: "Descanso",
              value: {
                horse: { ...ownedHorseExample, energy: 75, turnsLeft: ownedHorseExample.turnsLeft - 1 },
                rest: restExample
              }
            }
          }
        ),
        "404": notOwned,
        "409": errorResponse("Aposentada, ou já com energia 100.", "A carreira dela terminou.", "Ela já está descansada"),
        "500": protectedServerError("Erro ao descansar")
      }
    })
  },

  "/user/me/horses/{horseId}/new-career": {
    post: secured({
      tags: ["Treino e carreira"],
      summary: "Começar nova carreira",
      description:
        "Gratuito. Só para égua aposentada: cria uma cópia nova com os atributos do catálogo e o calendário " +
        "do início. A cópia aposentada continua no save como registro.",
      operationId: "startNewCareer",
      parameters: [horseIdParam],
      responses: {
        "201": jsonResponse("Carreira nova criada.", ownedHorseResponse, {
          fresh: {
            summary: "Cópia nova",
            value: {
              horse: {
                ...ownedHorseExample,
                ownedHorseId: "66f6a1c2e4b0a1b2c3d4e7b1",
                speed: 84,
                stamina: 48,
                power: 60,
                wit: 52,
                turnsLeft: ownedHorseExample.career.races[0].turnsBefore,
                skillPoints: 0,
                skills: [],
                energy: 100,
                runningStyle: "pace",
                fans: 0,
                racesRun: 0,
                racesWon: 0,
                career: {
                  ...ownedHorseExample.career,
                  raceIndex: 0,
                  results: [],
                  nextRace: ownedHorseExample.career.races[0]
                }
              }
            }
          }
        }),
        "404": notOwned,
        "409": errorResponse("Ela ainda está numa carreira ativa.", "Ela já está numa carreira."),
        "500": protectedServerError("Erro ao começar nova carreira")
      }
    })
  },

  "/user/me/horses/{horseId}/skills": {
    post: secured({
      tags: ["Skills"],
      summary: "Aprender skill",
      description:
        "Paga o `cost` da skill em skill points (sem mínimo de atributo desde a task 16). **Não gasta turno.**",
      operationId: "learnSkill",
      parameters: [horseIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["skillId"],
              properties: { skillId: { type: "string", description: "ObjectId ou slug da skill." } }
            },
            examples: {
              slug: { summary: "Por slug", value: { skillId: "steady-breathing" } },
              objectId: { summary: "Por ObjectId", value: { skillId: IDS.skill } }
            }
          }
        }
      },
      responses: {
        "200": jsonResponse(
          "Aprendida.",
          {
            type: "object",
            required: ["msg", "skill", "horse"],
            properties: {
              msg: { type: "string", const: "Skill aprendida!" },
              skill: ref("Skill"),
              horse: ref("OwnedHorse")
            }
          },
          {
            learned: {
              summary: "Skill aprendida",
              value: {
                msg: "Skill aprendida!",
                skill: skillExample,
                horse: ownedHorseExample
              }
            }
          }
        ),
        "404": errorResponse(
          "Skill inexistente, ou égua fora do save.",
          "Skill não encontrada",
          "Cavalo não pertence ao usuário"
        ),
        "409": errorResponse(
          "Aposentada, skill repetida ou skill points insuficientes.",
          "A carreira dela terminou.",
          "Skill já aprendida",
          {
            summary: "Skill points insuficientes",
            value: { msg: "Skill points insuficientes", required: skillExample.cost, available: 44 }
          }
        ),
        "422": errorResponse("`skillId` ausente ou não é texto.", "Skill é obrigatória"),
        "500": protectedServerError("Erro ao aprender skill")
      }
    })
  }
};

import type { OpenAPIV3_1 } from "openapi-types";
import { CAREER_STATUSES, MAX_ENERGY, MAX_MOOD, RUNNING_STYLES } from "../../models/user";
import { SKILL_EFFECT_KINDS, SKILL_PHASES, SKILL_RARITIES, SKILL_TERRAINS } from "../../models/skill";
import { TRACK_CATEGORIES, TRACK_SURFACES, TRACK_TERRAINS } from "../../models/track";
import { TRAIN_TYPES } from "../../services/trainingEngine";
import {
  careerOutcomeExamples,
  careerViewExample,
  catalogHorseExample,
  ownedHorseExample,
  raceResultExample,
  restExample,
  simulationExample,
  skillExample,
  trackExample,
  trainingExample,
  userExample,
  userProfileExample
} from "./examples";

type Schema = OpenAPIV3_1.SchemaObject;

/** `$ref` to a schema of this file. */
export const ref = (name: string): OpenAPIV3_1.ReferenceObject => ({ $ref: `#/components/schemas/${name}` });

/** The enums come from the models, so a new value shows up here without touching the docs. */
const RUNNING_STYLE_ENUM = [...RUNNING_STYLES];
const STAT_NAMES = ["speed", "stamina", "power", "wit"];
const RACE_PHASES = ["opening", "middle", "final", "spurt"];

type Scalar = OpenAPIV3_1.NonArraySchemaObject;

const dateTime = (description: string): Scalar => ({ type: "string", format: "date-time", description });
const integer = (description: string, extra: Scalar = {}): Scalar => ({ type: "integer", description, ...extra });
const number = (description: string, extra: Scalar = {}): Scalar => ({ type: "number", description, ...extra });
const string = (description: string, extra: Scalar = {}): Scalar => ({ type: "string", description, ...extra });
const withDescription = (name: string, description: string) => ({ ...ref(name), description });

const versionKey = integer("Versão do documento (chave `__v` do Mongoose).");

/** Fields shared by every copy of a horse girl in the save (`User.horses[]`). */
const ownedHorseFields: Record<string, Schema | OpenAPIV3_1.ReferenceObject> = {
  sourceHorseId: withDescription("ObjectId", "Id da égua no catálogo (`GET /horse`)."),
  name: string("Nome da égua."),
  passiveBuff: string("Texto de loja. Nenhum código aplica esse bônus."),
  speed: integer("Velocidade atual (catálogo + treinos da carreira).", { minimum: 0 }),
  stamina: integer("Fôlego atual.", { minimum: 0 }),
  power: integer("Potência atual.", { minimum: 0 }),
  wit: integer("Inteligência atual.", { minimum: 0 }),
  cost: integer("Preço pago no catálogo.", { minimum: 1 }),
  turnsLeft: integer(
    "Turnos até a próxima prova da carreira. Em 0 a prova da carreira fica obrigatória.",
    { minimum: 0 }
  ),
  skillPoints: integer("Skill points disponíveis para aprender skills.", { minimum: 0 }),
  skills: { type: "array", items: ref("LearnedSkill"), description: "Skills já aprendidas, na ordem de compra." },
  energy: integer("Energia. Treinar gasta 20, correr gasta 35, descansar devolve 45.", {
    minimum: 0,
    maximum: MAX_ENERGY
  }),
  mood: integer("Humor, de 1 (péssimo) a 5 (ótimo). Multiplica o ganho do treino.", {
    minimum: 1,
    maximum: MAX_MOOD
  }),
  runningStyle: string("Estilo de corrida. Hoje é só gravado: não muda a simulação.", {
    enum: RUNNING_STYLE_ENUM
  }),
  fans: integer("Fãs acumulados nesta carreira.", { minimum: 0 }),
  racesRun: integer("Corridas disputadas nesta carreira.", { minimum: 0 }),
  racesWon: integer("Vitórias nesta carreira.", { minimum: 0 })
};

const ownedHorseRequired = [
  "_id",
  "name",
  "speed",
  "stamina",
  "power",
  "wit",
  "cost",
  "turnsLeft",
  "skillPoints",
  "skills",
  "energy",
  "mood",
  "runningStyle",
  "fans",
  "racesRun",
  "racesWon"
];

const userFields = (horseSchema: string): Record<string, Schema | OpenAPIV3_1.ReferenceObject> => ({
  _id: ref("ObjectId"),
  username: string("Nome de exibição (com `trim`)."),
  email: string("E-mail, normalizado com `trim` e minúsculas. Único.", { format: "email" }),
  monies: integer("Dinheiro do jogador. Começa em 1000.", { minimum: 0 }),
  horses: { type: "array", items: ref(horseSchema), description: "Todas as cópias de éguas do save, inclusive aposentadas." },
  createdAt: dateTime("Criação da conta."),
  updatedAt: dateTime("Última alteração do save."),
  __v: versionKey
});

export const schemas: Record<string, Schema> = {
  ObjectId: {
    type: "string",
    pattern: "^[a-f\\d]{24}$",
    description: "ObjectId do MongoDB em hexadecimal (24 caracteres).",
    examples: ["66f6a1c2e4b0a1b2c3d4e601"]
  },

  Error: {
    type: "object",
    description:
      "Formato de erro usado pela maioria das rotas. Algumas respostas trazem campos extras " +
      "(`required`, `available`, `trackSlug`).",
    required: ["msg"],
    properties: {
      msg: string("Mensagem em português, pronta para mostrar. Em `/user/create` é uma chave `USER_MESSAGES.*`.")
    },
    additionalProperties: true,
    examples: [{ msg: "Cavalo não pertence ao usuário" }]
  },

  ErrorLegacy: {
    type: "object",
    description:
      "⚠️ Formato de erro antigo, com a chave `error` em vez de `msg`. Usado por `GET /horse`, " +
      "`GET /horse/{id}` e parte de `GET /user/me`. Será padronizado numa task própria.",
    required: ["error"],
    properties: { error: string("Mensagem ou chave `USER_MESSAGES.*`.") },
    examples: [{ error: "Cavalo não encontrado." }]
  },

  StatBlock: {
    type: "object",
    description: "Os quatro atributos de uma corredora.",
    required: STAT_NAMES,
    properties: {
      speed: number("Velocidade. No motor por turnos é o teto em m/turno.", { minimum: 0 }),
      stamina: number("Fôlego: pontos gastos a cada turno.", { minimum: 0 }),
      power: number("Potência: aceleração por turno.", { minimum: 0 }),
      wit: number("Inteligência: economia de fôlego e chance de skill.", { minimum: 0 })
    },
    examples: [{ speed: 84, stamina: 48, power: 60, wit: 52 }]
  },

  Horse: {
    type: "object",
    description: "Égua do catálogo da loja (coleção `horses`).",
    required: ["_id", "name", "speed", "stamina", "power", "wit", "cost"],
    properties: {
      _id: ref("ObjectId"),
      name: string("Nome."),
      passiveBuff: string("Texto de loja. Nenhum código aplica esse bônus."),
      speed: integer("Velocidade inicial.", { minimum: 0 }),
      stamina: integer("Fôlego inicial.", { minimum: 0 }),
      power: integer("Potência inicial.", { minimum: 0 }),
      wit: integer("Inteligência inicial.", { minimum: 0 }),
      cost: integer("Preço na loja.", { minimum: 1 }),
      createdAt: dateTime("Criação."),
      updatedAt: dateTime("Última alteração."),
      __v: versionKey
    },
    examples: [catalogHorseExample]
  },

  LearnedSkill: {
    type: "object",
    description: "Skill aprendida, copiada no momento da compra para que corridas antigas continuem legíveis.",
    required: ["slug", "name", "learnedAt"],
    properties: {
      skillId: withDescription("ObjectId", "Id da skill no catálogo."),
      slug: string("Slug da skill."),
      name: string("Nome da skill."),
      learnedAt: dateTime("Quando foi aprendida.")
    },
    examples: [ownedHorseExample.skills[0]]
  },

  CareerRace: {
    type: "object",
    description: "Uma prova do calendário de carreira da égua (`src/data/careers.ts`).",
    required: ["index", "trackSlug", "trackName", "turnsBefore", "goal"],
    properties: {
      index: integer("Posição no calendário, a partir de 0.", { minimum: 0 }),
      trackSlug: string("Slug da pista."),
      trackName: string("Nome da pista."),
      turnsBefore: integer("Turnos de preparação antes da prova.", { minimum: 1 }),
      goal: integer("Pior colocação que mantém a carreira (3 = top 3).", { minimum: 1 })
    },
    examples: [careerViewExample.races[0]]
  },

  CareerResult: {
    type: "object",
    description: "Prova da carreira já disputada.",
    required: ["raceIndex", "trackSlug", "trackName", "goal", "placement", "fieldSize", "passed", "ranAt"],
    properties: {
      raceIndex: integer("Índice da prova no calendário.", { minimum: 0 }),
      trackSlug: string("Slug da pista."),
      trackName: string("Nome da pista."),
      goal: integer("Objetivo de colocação da prova.", { minimum: 1 }),
      placement: integer("Colocação obtida (1 = vitória).", { minimum: 1 }),
      fieldSize: integer("Número de corredoras.", { minimum: 1 }),
      passed: { type: "boolean", description: "`true` quando `placement <= goal`." },
      ranAt: dateTime("Quando foi corrida.")
    },
    examples: [careerViewExample.results[0]]
  },

  StoredCareer: {
    type: "object",
    description:
      "Carreira como está gravada no banco. Aparece em `user.horses[]` nas respostas de " +
      "`POST /user/create` e `POST /user/me/purchase-horse`; as outras rotas devolvem `CareerView`.",
    required: ["status", "raceIndex", "results"],
    properties: {
      status: string("`active` corre; `completed` e `failed` estão aposentadas.", { enum: [...CAREER_STATUSES] }),
      raceIndex: integer("Índice da próxima prova do calendário.", { minimum: 0 }),
      results: { type: "array", items: ref("CareerResult") },
      endedAt: dateTime("Quando a carreira terminou. Ausente enquanto ativa.")
    },
    examples: [{ status: "active", raceIndex: 0, results: [] }]
  },

  CareerView: {
    type: "object",
    description: "Carreira pronta para a tela: status, calendário completo, resultados e próxima prova.",
    required: ["status", "raceIndex", "races", "results", "endedAt", "nextRace", "raceDue"],
    properties: {
      status: string("`active` corre; `completed` e `failed` estão aposentadas.", { enum: [...CAREER_STATUSES] }),
      raceIndex: integer("Índice da próxima prova do calendário.", { minimum: 0 }),
      races: { type: "array", items: ref("CareerRace"), description: "Calendário completo da égua." },
      results: { type: "array", items: ref("CareerResult"), description: "Provas da carreira já corridas." },
      endedAt: { type: ["string", "null"], format: "date-time", description: "Fim da carreira, ou `null` enquanto ativa." },
      nextRace: {
        anyOf: [ref("CareerRace"), { type: "null" }],
        description: "Prova para a qual os turnos contam, ou `null` se aposentada."
      },
      raceDue: { type: "boolean", description: "`true` com a carreira ativa e 0 turnos: só a prova da carreira é aceita." }
    },
    examples: [careerViewExample]
  },

  CareerOutcomePassed: {
    type: "object",
    description: "Cumpriu o objetivo e há outra prova no calendário.",
    required: ["kind", "goal", "placement", "next"],
    properties: {
      kind: { type: "string", const: "passed" },
      goal: integer("Objetivo da prova corrida.", { minimum: 1 }),
      placement: integer("Colocação obtida.", { minimum: 1 }),
      next: withDescription("CareerRace", "Próxima prova. `turnsLeft` da égua passa a ser `next.turnsBefore`.")
    },
    examples: [careerOutcomeExamples.passed]
  },

  CareerOutcomeCompleted: {
    type: "object",
    description: "Cumpriu o objetivo da última prova: carreira concluída e égua aposentada.",
    required: ["kind", "goal", "placement"],
    properties: {
      kind: { type: "string", const: "completed" },
      goal: integer("Objetivo da prova corrida.", { minimum: 1 }),
      placement: integer("Colocação obtida.", { minimum: 1 })
    },
    examples: [careerOutcomeExamples.completed]
  },

  CareerOutcomeFailed: {
    type: "object",
    description: "Não cumpriu o objetivo: carreira encerrada e égua aposentada.",
    required: ["kind", "goal", "placement"],
    properties: {
      kind: { type: "string", const: "failed" },
      goal: integer("Objetivo da prova corrida.", { minimum: 1 }),
      placement: integer("Colocação obtida.", { minimum: 1 })
    },
    examples: [careerOutcomeExamples.failed]
  },

  CareerOutcome: {
    description: "Resultado de uma prova da carreira, discriminado por `kind`.",
    oneOf: [ref("CareerOutcomePassed"), ref("CareerOutcomeCompleted"), ref("CareerOutcomeFailed")],
    discriminator: {
      propertyName: "kind",
      mapping: {
        passed: "#/components/schemas/CareerOutcomePassed",
        completed: "#/components/schemas/CareerOutcomeCompleted",
        failed: "#/components/schemas/CareerOutcomeFailed"
      }
    }
  },

  OwnedHorse: {
    type: "object",
    description:
      "Égua do usuário como as rotas `/user/me/horses/{horseId}/*`, `/race/run` e `/skills` a devolvem. " +
      "**Atenção:** aqui `_id` é o id do **catálogo** (o mesmo de `GET /horse`); o id da cópia no " +
      "save está em `ownedHorseId`. Em `GET /user/me` é o contrário (ver `UserOwnedHorseView`).",
    required: [...ownedHorseRequired, "ownedHorseId", "sourceHorseId", "career"],
    properties: {
      _id: withDescription("ObjectId", "Id da égua no **catálogo**."),
      ownedHorseId: withDescription("ObjectId", "Id da **cópia** (subdocumento em `User.horses`)."),
      ...ownedHorseFields,
      cost: integer("Preço atual no catálogo.", { minimum: 1 }),
      career: ref("CareerView")
    },
    examples: [ownedHorseExample]
  },

  UserOwnedHorse: {
    type: "object",
    description:
      "Cópia de égua crua, como gravada em `User.horses`. `_id` é o id da **cópia**, não do catálogo.",
    required: ownedHorseRequired,
    properties: {
      _id: withDescription("ObjectId", "Id da **cópia**."),
      ...ownedHorseFields,
      career: ref("StoredCareer")
    }
  },

  UserOwnedHorseView: {
    type: "object",
    description:
      "Cópia de égua em `GET /user/me`. `_id` é o id da **cópia** (nas rotas de égua do usuário é o do " +
      "catálogo). `career` vem como `CareerView`; é omitido em cópias antigas sem carreira.",
    required: ownedHorseRequired,
    properties: {
      _id: withDescription("ObjectId", "Id da **cópia**."),
      ...ownedHorseFields,
      career: ref("CareerView")
    }
  },

  User: {
    type: "object",
    description: "Usuário **sem** `password`, como `POST /user/create` e a compra de égua devolvem.",
    required: ["_id", "username", "email", "monies", "horses"],
    properties: userFields("UserOwnedHorse"),
    examples: [userExample]
  },

  UserProfile: {
    type: "object",
    description: "Usuário **sem** `password` em `GET /user/me`, com a carreira de cada égua já como `CareerView`.",
    required: ["_id", "username", "email", "monies", "horses"],
    properties: userFields("UserOwnedHorseView"),
    examples: [userProfileExample]
  },

  TrackSegment: {
    type: "object",
    description: "Trecho da pista. A soma dos `lengthRatio` de uma pista é 1.",
    required: ["label", "lengthRatio", "grade", "curve"],
    properties: {
      label: string("Nome do trecho."),
      lengthRatio: number("Fração da distância total.", { minimum: 0.01, maximum: 1 }),
      grade: number("Inclinação em %: positivo sobe, negativo desce. Legado: o motor por turnos ignora.", {
        minimum: -12,
        maximum: 12
      }),
      curve: number("Fechamento da curva, 0 (reta) a 1. Entrar numa curva custa velocidade.", {
        minimum: 0,
        maximum: 1
      })
    },
    examples: [trackExample.segments[0]]
  },

  Track: {
    type: "object",
    description:
      "Pista do catálogo. `statWeights` e `grade` são legado: o motor por turnos não os usa. " +
      "`id` e `maxGrade` são virtuais do Mongoose.",
    required: [
      "_id",
      "id",
      "slug",
      "name",
      "location",
      "distance",
      "category",
      "surface",
      "terrain",
      "segments",
      "statWeights",
      "requirements",
      "fieldSize",
      "difficulty",
      "entryFee",
      "prizeMoney",
      "fansReward",
      "skillPointReward",
      "maxGrade"
    ],
    properties: {
      _id: ref("ObjectId"),
      id: withDescription("ObjectId", "Igual a `_id` (virtual do Mongoose)."),
      slug: string("Identificador legível, aceito no lugar do ObjectId."),
      name: string("Nome."),
      location: string("Hipódromo."),
      description: string("Texto da tela de seleção."),
      image: string("Arquivo da arte em `frontend/public`."),
      distance: integer("Distância em metros.", { minimum: 800, maximum: 4000 }),
      category: string("Faixa de distância.", { enum: [...TRACK_CATEGORIES] }),
      surface: string("Piso.", { enum: [...TRACK_SURFACES] }),
      terrain: string("Perfil do terreno.", { enum: [...TRACK_TERRAINS] }),
      segments: { type: "array", items: ref("TrackSegment") },
      statWeights: withDescription("StatBlock", "Legado: peso de cada atributo no motor antigo."),
      requirements: withDescription(
        "StatBlock",
        "Mínimos recomendados. Abaixo deles a corredora aparece em `shortfalls` e o campo de rivais é calibrado a partir deles."
      ),
      fieldSize: integer("Corredoras na prova, contando a do jogador.", { minimum: 2, maximum: 18 }),
      difficulty: integer("Dificuldade de 1 a 10. Escala os atributos das rivais comuns.", { minimum: 1, maximum: 10 }),
      entryFee: integer("Inscrição. Grátis na prova da carreira.", { minimum: 0 }),
      prizeMoney: {
        type: "array",
        items: { type: "integer", minimum: 0 },
        description: "Prêmio por colocação; índice 0 é o 1º lugar. Fora da lista o prêmio é 0."
      },
      fansReward: integer("Fãs pelo 1º lugar; as outras colocações recebem uma fração.", { minimum: 0 }),
      skillPointReward: integer("Skill points pelo 1º lugar; as outras colocações recebem uma fração.", { minimum: 0 }),
      maxGrade: number("Maior `grade` entre os trechos (virtual)."),
      createdAt: dateTime("Criação."),
      updatedAt: dateTime("Última alteração."),
      __v: versionKey
    },
    examples: [trackExample]
  },

  SkillEffect: {
    type: "object",
    description:
      "O que a skill faz. A unidade de `value` depende de `kind`:\n\n" +
      "| `kind` | `value` |\n|---|---|\n" +
      "| `speedBoost`, `startDash`, `cornerBoost` | m/turno somados à velocidade |\n" +
      "| `accelBoost` | multiplicador da aceleração |\n" +
      "| `staminaRecover` | fração da barra de fôlego devolvida |\n" +
      "| `staminaSave` | fração do custo de fôlego cortada |\n" +
      "| `inclineBoost` | fração da penalidade de subida cancelada. **Sem efeito no motor atual** (ele ignora inclinação) |\n" +
      "| `flatStat` | pontos somados a `stat` durante a corrida inteira |",
    required: ["kind", "value", "duration"],
    properties: {
      kind: string("Tipo de efeito.", { enum: [...SKILL_EFFECT_KINDS] }),
      stat: string("Só em `flatStat`: atributo que recebe o bônus.", { enum: STAT_NAMES }),
      value: number("Magnitude; unidade conforme a tabela acima."),
      duration: integer("Duração em turnos. Ignorada por efeitos instantâneos.", { minimum: 0 })
    },
    examples: [skillExample.effect]
  },

  SkillTrigger: {
    type: "object",
    description: "Quando a skill pode disparar. A chance é testada uma vez por turno elegível.",
    required: ["phase", "terrain", "baseChance"],
    properties: {
      phase: string("Fase da corrida exigida.", { enum: [...SKILL_PHASES] }),
      terrain: string("Trecho exigido.", { enum: [...SKILL_TERRAINS] }),
      baseChance: number("Chance por turno antes do bônus de Wit.", { minimum: 0, maximum: 1 }),
      maxStaminaRatio: number("Só dispara com o fôlego nesta fração ou abaixo.", { minimum: 0, maximum: 1 }),
      minPosition: integer("Só dispara nesta colocação ou atrás.", { minimum: 1 })
    },
    examples: [skillExample.trigger]
  },

  Skill: {
    type: "object",
    description: "Skill do catálogo. Custa só skill points (sem mínimo de atributo desde a task 16).",
    required: ["_id", "slug", "name", "description", "rarity", "cost", "effect", "trigger"],
    properties: {
      _id: ref("ObjectId"),
      slug: string("Identificador legível, aceito no lugar do ObjectId."),
      name: string("Nome."),
      description: string("Descrição para o jogador."),
      icon: string("Ícone (opcional)."),
      rarity: string("Raridade. `unique` não entra no sorteio das rivais.", { enum: [...SKILL_RARITIES] }),
      cost: integer("Preço em skill points.", { minimum: 1 }),
      effect: ref("SkillEffect"),
      trigger: ref("SkillTrigger"),
      createdAt: dateTime("Criação."),
      updatedAt: dateTime("Última alteração."),
      __v: versionKey
    },
    examples: [skillExample]
  },

  TrainingOutcome: {
    type: "object",
    description: "Resultado de um treino, calculado no servidor a partir da pontuação do minigame.",
    required: ["statGain", "skillPointsGained", "energySpent", "moodChange", "failed", "notes"],
    properties: {
      statGain: integer("Pontos somados ao atributo treinado (mínimo 1).", { minimum: 1 }),
      skillPointsGained: integer("`max(1, round(ganho × 0,45))`, +8 num round perfeito.", { minimum: 1 }),
      energySpent: integer("Energia gasta (sempre 20)."),
      moodChange: integer("Mudança de humor: −1 no treino fracassado, +1 com 90% da pontuação.", {
        minimum: -1,
        maximum: 1
      }),
      failed: { type: "boolean", description: "`true` quando a energia baixa (< 25) estragou o treino." },
      notes: { type: "array", items: { type: "string" }, description: "Motivos legíveis, mostrados na tela de resultado." }
    },
    examples: [trainingExample]
  },

  RestOutcome: {
    type: "object",
    description: "Resultado de um descanso.",
    required: ["energyRecovered", "energy", "mood", "turnSpent"],
    properties: {
      energyRecovered: integer("Energia recuperada (até 45, limitada a 100).", { minimum: 0 }),
      energy: integer("Energia depois do descanso.", { minimum: 0, maximum: MAX_ENERGY }),
      mood: integer("Humor depois do descanso (+1, até 5).", { minimum: 1, maximum: MAX_MOOD }),
      turnSpent: {
        type: "boolean",
        description: "`false` quando ela já estava com 0 turnos: descansar continua permitido para não travar a prova obrigatória."
      }
    },
    examples: [restExample]
  },

  RaceRunner: {
    type: "object",
    description: "Corredora no replay. A ordem de `runners` é a ordem de `positions` e `stamina` em cada frame.",
    required: ["id", "name", "isPlayer", "isRival", "runningStyle"],
    properties: {
      id: string("`player` ou `rival-N`."),
      name: string("Nome."),
      isPlayer: { type: "boolean", description: "`true` só para a égua do jogador." },
      isRival: { type: "boolean", description: "Uma das 3 rivais montadas sobre os atributos do jogador (task 19)." },
      runningStyle: string("Estilo de corrida.", { enum: RUNNING_STYLE_ENUM })
    }
  },

  RivalProfile: {
    type: "object",
    description: "Rival como alinhou no portão: atributos treinados (antes das skills passivas) e skills.",
    required: ["id", "name", "runningStyle", "stats", "skills"],
    properties: {
      id: string("Id da corredora (`rival-N`)."),
      name: string("Nome."),
      runningStyle: string("Estilo de corrida.", { enum: RUNNING_STYLE_ENUM }),
      stats: ref("StatBlock"),
      skills: { type: "array", items: { type: "string" }, description: "Nomes das skills dela." }
    }
  },

  RaceFrame: {
    type: "object",
    description: "Amostra do replay. O motor gera 4 frames por turno.",
    required: ["t", "positions", "stamina"],
    properties: {
      t: number("Turnos desde a largada (0,25 por frame).", { minimum: 0 }),
      positions: {
        type: "array",
        items: { type: "number", minimum: 0 },
        description: "Metros percorridos por corredora, na ordem de `runners`."
      },
      stamina: {
        type: "array",
        items: { type: "number", minimum: 0, maximum: 1 },
        description: "Fôlego restante de cada corredora, fração de 0 a 1, na ordem de `runners`."
      }
    }
  },

  RaceRunnerResult: {
    type: "object",
    description: "Resultado final de uma corredora.",
    required: [
      "id",
      "name",
      "isPlayer",
      "runningStyle",
      "placement",
      "finishTime",
      "topSpeed",
      "staminaLeft",
      "exhausted",
      "skillsActivated"
    ],
    properties: {
      id: string("Id da corredora."),
      name: string("Nome."),
      isPlayer: { type: "boolean" },
      runningStyle: string("Estilo de corrida.", { enum: RUNNING_STYLE_ENUM }),
      placement: integer("Colocação, 1 = vencedora.", { minimum: 1 }),
      finishTime: number("Turnos até cruzar a linha; a fração desempata chegadas no mesmo turno."),
      topSpeed: number("Maior velocidade atingida, skills incluídas, em m/turno."),
      staminaLeft: number("Fôlego restante, fração de 0 a 1.", { minimum: 0, maximum: 1 }),
      exhausted: { type: "boolean", description: "`true` quando esvaziou o fôlego antes da linha." },
      skillsActivated: { type: "array", items: { type: "string" }, description: "Nomes das skills que dispararam." }
    }
  },

  SkillActivation: {
    type: "object",
    description: "Uma skill que disparou durante a corrida.",
    required: ["runnerId", "runnerName", "skillSlug", "skillName", "time", "distance"],
    properties: {
      runnerId: string("Id da corredora."),
      runnerName: string("Nome da corredora."),
      skillSlug: string("Slug da skill."),
      skillName: string("Nome da skill."),
      time: integer("Turno em que disparou, contado de 0 na largada.", { minimum: 0 }),
      distance: number("Metros percorridos quando disparou.", { minimum: 0 })
    }
  },

  Shortfall: {
    type: "object",
    description: "Atributo abaixo do mínimo recomendado pela pista.",
    required: ["stat", "required", "current"],
    properties: {
      stat: string("Atributo.", { enum: STAT_NAMES }),
      required: number("Mínimo da pista (`requirements`)."),
      current: number("Valor da corredora.")
    }
  },

  RunnerTelemetry: {
    type: "object",
    description: "O que o motor decidiu para a égua do jogador em um turno. Só leitura: nunca volta para o motor.",
    required: [
      "turn",
      "phase",
      "pressure",
      "placement",
      "speed",
      "runSpeed",
      "ceiling",
      "accel",
      "curveLoss",
      "staminaCost",
      "staminaSave",
      "stamina",
      "staminaRange",
      "remaining",
      "pace",
      "tired",
      "effects"
    ],
    properties: {
      turn: integer("Turno, contado de 1.", { minimum: 1 }),
      phase: string("Fase da corrida.", { enum: RACE_PHASES }),
      pressure: number("Multiplicador do custo de fôlego: 1, 1,25 ou 1,5 conforme o terço da prova.", {
        enum: [1, 1.25, 1.5]
      }),
      placement: integer("Colocação no início do turno, 1 = líder.", { minimum: 1 }),
      speed: number("Velocidade base no turno, m/turno (sem skills)."),
      runSpeed: number("Velocidade de fato corrida, skills de velocidade incluídas, m/turno."),
      ceiling: number("Teto no turno: Speed, ou Speed / 2 quando cansada, m/turno."),
      accel: number("Velocidade ganha no turno, m/turno. 0 no teto ou no turno 1; negativa quando o cansaço corta o teto."),
      curveLoss: number("Velocidade perdida ao entrar numa curva no fim do turno, m/turno (0 se nenhuma).", { minimum: 0 }),
      staminaCost: number("Fôlego gasto no turno, em pontos de Stamina.", { minimum: 0 }),
      staminaSave: number("Corte aplicado ao custo (Wit + skills), fração.", { minimum: 0, maximum: 0.6 }),
      stamina: number("Fôlego restante depois do turno, em pontos (pode ficar negativo)."),
      staminaRange: number(
        "Metros que ela ainda consegue correr com o fôlego do início do turno, mantendo a velocidade (ou o teto, se ainda acelera) e pagando a pressão de cada terço.",
        { minimum: 0 }
      ),
      remaining: number("Metros até a linha no início do turno.", { minimum: 0 }),
      pace: string("Fôlego × pista restante: `safe` sobra, `tight` dá no limite, `rushed` não chega.", {
        enum: ["safe", "tight", "rushed"]
      }),
      tired: { type: "boolean", description: "`true` quando o fôlego acabou e o teto caiu pela metade." },
      effects: {
        type: "array",
        items: { type: "string", enum: [...SKILL_EFFECT_KINDS] },
        description: "Tipos de efeito de skill ativos no turno."
      }
    }
  },

  RaceSimulation: {
    type: "object",
    description:
      "Replay completo de uma corrida do motor por turnos. Tempo em **turnos**, distância em **metros**, " +
      "velocidade em **m/turno**. O replay não é gravado: só volta nesta resposta.",
    required: ["seed", "trackSlug", "distance", "runners", "rivals", "frames", "results", "activations", "shortfalls", "telemetry"],
    properties: {
      seed: integer("Semente do sorteio (campo, rivais e skills). A mesma seed com as mesmas entradas repete a corrida.", {
        minimum: 0
      }),
      trackSlug: string("Pista corrida."),
      distance: integer("Distância em metros."),
      runners: { type: "array", items: ref("RaceRunner"), description: "Corredoras na ordem usada por todos os frames." },
      rivals: {
        type: "array",
        items: ref("RivalProfile"),
        description: "As 3 rivais montadas sobre os atributos da égua do jogador (0,9–1,3× cada atributo, task 19)."
      },
      frames: { type: "array", items: ref("RaceFrame"), description: "Amostras do replay, 4 por turno." },
      results: { type: "array", items: ref("RaceRunnerResult"), description: "Resultado de cada corredora, por colocação." },
      activations: { type: "array", items: ref("SkillActivation"), description: "Skills que dispararam, em ordem de tempo." },
      shortfalls: {
        type: "object",
        description: "Atributos abaixo dos mínimos da pista, indexados pelo id da corredora. Corredoras sem falta não aparecem.",
        additionalProperties: { type: "array", items: ref("Shortfall") }
      },
      telemetry: {
        type: "array",
        items: ref("RunnerTelemetry"),
        description: "Telemetria da égua do jogador, um item por turno."
      }
    },
    examples: [simulationExample]
  },

  RaceRewards: {
    type: "object",
    description: "O que a corrida rendeu e custou.",
    required: ["placement", "prizeMoney", "entryFee", "skillPointsEarned", "fansEarned", "energySpent", "turnsLeft", "career"],
    properties: {
      placement: integer("Colocação da égua do jogador.", { minimum: 1 }),
      prizeMoney: integer("Prêmio pago (`track.prizeMoney[placement - 1]`, ou 0).", { minimum: 0 }),
      entryFee: integer("Inscrição cobrada. 0 na prova da carreira.", { minimum: 0 }),
      skillPointsEarned: integer("`round(track.skillPointReward × fator da colocação)`.", { minimum: 0 }),
      fansEarned: integer("`round(track.fansReward × fator da colocação)`. Fator: 1 / 0,6 / 0,42 / 0,28 (4º–5º) / 0,15.", {
        minimum: 0
      }),
      energySpent: integer("Energia gasta (sempre 35)."),
      turnsLeft: integer("Turnos restantes depois da corrida.", { minimum: 0 }),
      career: {
        anyOf: [ref("CareerOutcome"), { type: "null" }],
        description: "Resultado da prova da carreira, ou `null` numa prova avulsa."
      }
    }
  },

  RaceRunResponse: {
    type: "object",
    description: "Resposta de `POST /race/run`.",
    required: ["msg", "simulation", "rewards", "horse", "monies"],
    properties: {
      msg: string("`Vitória!` no 1º lugar, senão `Corrida concluída`.", { enum: ["Vitória!", "Corrida concluída"] }),
      simulation: ref("RaceSimulation"),
      rewards: ref("RaceRewards"),
      horse: withDescription("OwnedHorse", "A égua já com prêmios, energia, humor e turnos atualizados."),
      monies: integer("Dinheiro do usuário depois da inscrição e do prêmio.", { minimum: 0 })
    }
  },

  RaceResult: {
    type: "object",
    description: "Corrida gravada no histórico. O replay (`frames`) não é guardado.",
    required: [
      "_id",
      "userId",
      "trackId",
      "trackSlug",
      "trackName",
      "distance",
      "horseName",
      "runningStyle",
      "seed",
      "placement",
      "fieldSize",
      "finishTime",
      "timeUnit",
      "exhausted",
      "skillsActivated",
      "statsSnapshot",
      "prizeMoney",
      "skillPointsEarned",
      "fansEarned",
      "entryFee"
    ],
    properties: {
      _id: ref("ObjectId"),
      userId: ref("ObjectId"),
      trackId: ref("ObjectId"),
      trackSlug: string("Slug da pista."),
      trackName: string("Nome da pista."),
      distance: integer("Distância em metros."),
      horseName: string("Nome da égua."),
      sourceHorseId: withDescription("ObjectId", "Id da égua no catálogo."),
      runningStyle: string("Estilo usado.", { enum: RUNNING_STYLE_ENUM }),
      seed: integer("Semente da simulação."),
      placement: integer("Colocação.", { minimum: 1 }),
      fieldSize: integer("Número de corredoras.", { minimum: 1 }),
      finishTime: number("Tempo de chegada, na unidade de `timeUnit`."),
      timeUnit: string("`turns` no motor atual; `seconds` nas corridas antigas, do motor por ticks.", {
        enum: ["seconds", "turns"]
      }),
      exhausted: { type: "boolean", description: "Se esvaziou o fôlego antes da linha." },
      skillsActivated: { type: "array", items: { type: "string" }, description: "Nomes das skills que dispararam." },
      statsSnapshot: withDescription("StatBlock", "Atributos dela no momento da corrida."),
      prizeMoney: integer("Prêmio.", { minimum: 0 }),
      skillPointsEarned: integer("Skill points ganhos.", { minimum: 0 }),
      fansEarned: integer("Fãs ganhos.", { minimum: 0 }),
      entryFee: integer("Inscrição paga.", { minimum: 0 }),
      createdAt: dateTime("Quando foi corrida."),
      updatedAt: dateTime("Última alteração."),
      __v: versionKey
    },
    examples: [raceResultExample]
  },

  RaceHistory: {
    type: "object",
    description: "Página do histórico, mais recentes primeiro.",
    required: ["races", "total", "limit", "skip"],
    properties: {
      races: { type: "array", items: ref("RaceResult") },
      total: integer("Total de corridas do usuário.", { minimum: 0 }),
      limit: integer("Limite aplicado.", { minimum: 1, maximum: 50 }),
      skip: integer("Deslocamento aplicado.", { minimum: 0 })
    }
  }
};

export const TRAIN_TYPE_ENUM = [...TRAIN_TYPES];
export { RUNNING_STYLE_ENUM };

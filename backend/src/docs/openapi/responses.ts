import type { OpenAPIV3_1 } from "openapi-types";
import { ref } from "./schemas";

type Response = OpenAPIV3_1.ResponseObject;

/**
 * openapi-types' 3.1 PathItemObject intersects the 3.0 operation type and rejects any
 * 3.1 schema, so the path files use this instead; index.ts casts once.
 */
export type Paths = Record<string, Partial<Record<OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject>>>;
type Example = OpenAPIV3_1.ExampleObject | OpenAPIV3_1.ReferenceObject;

/** Turns "Cavalo não pertence ao usuário" into a key usable in an `examples` map. */
const exampleKey = (summary: string) =>
  summary
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60) || "example";

/** One error case: a message, or a whole body when it carries extra fields. */
export type ErrorCase = string | { summary: string; value: Record<string, unknown> };

const toExample = (errorCase: ErrorCase, key: "msg" | "error"): [string, Example] => {
  const summary = typeof errorCase === "string" ? errorCase : errorCase.summary;
  const value = typeof errorCase === "string" ? { [key]: errorCase } : errorCase.value;
  return [exampleKey(summary), { summary, value }];
};

/** Error response in the `{ msg }` format, one example per message. */
export const errorResponse = (description: string, ...cases: ErrorCase[]): Response => ({
  description,
  content: {
    "application/json": {
      schema: ref("Error"),
      examples: Object.fromEntries(cases.map((errorCase) => toExample(errorCase, "msg")))
    }
  }
});

/** ⚠️ Error response in the legacy `{ error }` format. */
export const legacyErrorResponse = (description: string, ...cases: string[]): Response => ({
  description: `⚠️ ${description} Formato legado \`{ error }\`.`,
  content: {
    "application/json": {
      schema: ref("ErrorLegacy"),
      examples: Object.fromEntries(cases.map((errorCase) => toExample(errorCase, "error")))
    }
  }
});

/**
 * 500 of a protected route: its own message plus the one authMiddleware sends when
 * SECRET_KEY is missing (both share the status code, so they share the response).
 */
export const protectedServerError = (...cases: ErrorCase[]): Response => {
  const response = errorResponse("Erro interno, ou `SECRET_KEY` ausente no servidor.", ...cases);
  const media = response.content!["application/json"];
  media.examples = {
    ...media.examples,
    authMisconfigured: { $ref: "#/components/examples/AuthMisconfigured" }
  };
  return response;
};

/** JSON success response. */
export const jsonResponse = (
  description: string,
  schema: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  examples: Record<string, { summary: string; value: unknown }>
): Response => ({
  description,
  content: { "application/json": { schema, examples } }
});

const byStatusCode = (responses: OpenAPIV3_1.ResponsesObject): OpenAPIV3_1.ResponsesObject =>
  Object.fromEntries(Object.entries(responses).sort(([a], [b]) => a.localeCompare(b)));

/** Marks an operation as behind authMiddleware: bearer token and its 401. */
export const secured = (operation: OpenAPIV3_1.OperationObject): OpenAPIV3_1.OperationObject => ({
  ...operation,
  security: [{ bearerAuth: [] }],
  responses: byStatusCode({
    "401": { $ref: "#/components/responses/Unauthorized" },
    ...operation.responses
  })
});

/** Public operation: says so explicitly (`security: []`) so linters know it is on purpose. */
export const open = (operation: OpenAPIV3_1.OperationObject): OpenAPIV3_1.OperationObject => ({
  ...operation,
  security: [],
  responses: byStatusCode(operation.responses ?? {})
});

export const responses: Record<string, Response> = {
  Unauthorized: {
    description:
      "Token ausente, expirado, malformado ou sem `id`/`userName` (vem do `authMiddleware`). " +
      "Os controllers ainda têm uma checagem própria que responderia `Usuário não autenticado`, " +
      "mas ela não é alcançável depois do middleware.",
    content: {
      "application/json": {
        schema: ref("Error"),
        examples: {
          missingToken: {
            summary: "Sem header Authorization",
            value: { msg: "Acesso negado: token não fornecido." }
          },
          invalidToken: { summary: "Token inválido ou expirado", value: { msg: "Token inválido." } }
        }
      }
    }
  }
};

export const examples: Record<string, OpenAPIV3_1.ExampleObject> = {
  AuthMisconfigured: {
    summary: "SECRET_KEY ausente no servidor",
    value: { msg: "Configuração de autenticação ausente." }
  }
};

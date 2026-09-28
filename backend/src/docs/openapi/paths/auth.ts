import { ref } from "../schemas";
import { type Paths, errorResponse, jsonResponse, open, secured } from "../responses";
import { IDS, userExample } from "../examples";

export const authPaths: Paths = {
  "/user/create": {
    post: open({
      tags: ["Auth"],
      summary: "Cadastrar usuário",
      description:
        "Cria a conta com `monies: 1000` e **uma égua sorteada do catálogo**, já com a carreira ativa " +
        "(`turnsLeft` = turnos da 1ª prova do calendário dela).\n\n" +
        "- A senha passa pelo middleware `encryptPassword` (bcrypt, salt 12) antes do controller.\n" +
        "- `email` é normalizado (`trim` + minúsculas) e `username` sofre `trim`.\n" +
        "- **Não há regra de tamanho ou formato de senha, nem validação de formato de e-mail.**\n" +
        "- As mensagens `USER_MESSAGES.*` são chaves, não texto pronto.",
      operationId: "createUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "email", "password"],
              properties: {
                username: { type: "string", description: "Nome de exibição." },
                email: { type: "string", description: "E-mail (único)." },
                password: { type: "string", description: "Senha em texto; é gravada como hash bcrypt." }
              }
            },
            example: { username: "Eduardo", email: "edu@example.com", password: "segredo123" }
          }
        }
      },
      responses: {
        "201": jsonResponse(
          "Usuário criado. Vem sem `password`; a carreira da égua vem crua (`StoredCareer`).",
          {
            type: "object",
            required: ["msg", "user"],
            properties: { msg: { type: "string", const: "USER_MESSAGES.USER_SAVED_SUCCESSFULLY" }, user: ref("User") }
          },
          { created: { summary: "Conta nova", value: { msg: "USER_MESSAGES.USER_SAVED_SUCCESSFULLY", user: userExample } } }
        ),
        "404": errorResponse("O catálogo de éguas está vazio: não há égua para sortear.", "Cavalo não encontrado"),
        "422": errorResponse(
          "Campo faltando ou e-mail já cadastrado.",
          "USER_MESSAGES.EMAIL_AND_PASSWORD_AND_USERNAME_REQUIRED",
          "Esse Email já está em uso"
        ),
        "500": errorResponse("Erro ao salvar o usuário.", "USER_MESSAGES.ERROR_SAVING_USER")
      }
    })
  },

  "/user/login": {
    post: open({
      tags: ["Auth"],
      summary: "Autenticar",
      description:
        "Devolve um JWT para usar em **Authorize** (esquema `bearerAuth`). O token é HS256, assinado " +
        "com `SECRET_KEY`, **expira em 1 hora** e tem o payload `{ id, userName }`.\n\n" +
        "⚠️ Usuário inexistente e senha errada respondem **422**, não 401.",
      operationId: "login",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", description: "E-mail (comparado depois de `trim` e minúsculas)." },
                password: { type: "string" }
              }
            },
            example: { email: "edu@example.com", password: "segredo123" }
          }
        }
      },
      responses: {
        "200": jsonResponse(
          "Autenticado.",
          {
            type: "object",
            required: ["msg", "token", "id"],
            properties: {
              msg: { type: "string", const: "Autenticação feita com sucesso" },
              token: { type: "string", description: "JWT, válido por 1 hora." },
              id: { ...ref("ObjectId"), description: "Id do usuário." }
            }
          },
          {
            ok: {
              summary: "Login feito",
              value: {
                msg: "Autenticação feita com sucesso",
                token:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjZhMWMyZTRiMGExYjJjM2Q0ZTVmNiIsInVzZXJOYW1lIjoiRWR1YXJkbyIsImlhdCI6MTc5MDUxMDQwMCwiZXhwIjoxNzkwNTE0MDAwfQ.signature",
                id: IDS.user
              }
            }
          }
        ),
        "422": errorResponse(
          "⚠️ Campo faltando ou credencial inválida (inclusive usuário inexistente e senha errada).",
          "O email é obrigatório",
          "A senha é obrigatória",
          "Usuário não encontrado",
          "Senha inválida"
        ),
        "500": errorResponse(
          "`SECRET_KEY` ausente ou falha ao assinar o token.",
          "Configuração de autenticação ausente",
          "Algum erro ocorreu"
        )
      }
    })
  },

  "/verify-token": {
    get: secured({
      tags: ["Auth"],
      summary: "Validar o token",
      description: "O frontend usa para saber se a sessão guardada ainda vale. Devolve o payload decodificado do JWT.",
      operationId: "verifyToken",
      responses: {
        "200": jsonResponse(
          "Token válido.",
          {
            type: "object",
            required: ["valid", "user"],
            properties: {
              valid: { type: "boolean", const: true },
              user: {
                type: "object",
                description: "Payload do JWT.",
                required: ["id", "userName", "iat", "exp"],
                properties: {
                  id: ref("ObjectId"),
                  userName: { type: "string" },
                  iat: { type: "integer", description: "Emissão, em segundos Unix." },
                  exp: { type: "integer", description: "Expiração, em segundos Unix (emissão + 3600)." }
                }
              }
            }
          },
          {
            ok: {
              summary: "Sessão válida",
              value: { valid: true, user: { id: IDS.user, userName: "Eduardo", iat: 1790510400, exp: 1790514000 } }
            }
          }
        ),
        "500": {
          description: "`SECRET_KEY` ausente no servidor.",
          content: {
            "application/json": {
              schema: ref("Error"),
              examples: { authMisconfigured: { $ref: "#/components/examples/AuthMisconfigured" } }
            }
          }
        }
      }
    })
  }
};

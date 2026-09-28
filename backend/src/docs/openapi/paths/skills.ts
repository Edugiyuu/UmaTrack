import { ref } from "../schemas";
import { type Paths, errorResponse, jsonResponse, open } from "../responses";
import { skillExample } from "../examples";

export const skillPaths: Paths = {
  "/skill": {
    get: open({
      tags: ["Skills"],
      summary: "Listar as skills",
      description:
        "Catálogo de skills, ordenado por `cost` e depois `name`. A unidade de `effect.value` depende de " +
        "`effect.kind` (ver o schema `SkillEffect`). `inclineBoost` não tem efeito no motor atual.",
      operationId: "listSkills",
      responses: {
        "200": jsonResponse("Skills.", { type: "array", items: ref("Skill") }, {
          skills: { summary: "Catálogo (recortado)", value: [skillExample] }
        }),
        "500": errorResponse("Erro ao ler o catálogo.", "Erro ao buscar skills.")
      }
    })
  }
};

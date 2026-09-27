import Skill from "../models/skill";
import { SKILL_CATALOG } from "../data/skills";

/**
 * Upserts the skill catalogue by slug on boot. Idempotent. Also drops the stat
 * requirements older databases still carry: skills cost skill points only (task 16).
 */
export const ensureSkillsSeeded = async () => {
  const operations = SKILL_CATALOG.map((skill) => ({
    updateOne: {
      filter: { slug: skill.slug },
      update: { $set: skill, $unset: { requirements: "" } },
      upsert: true
    }
  }));

  const result = await Skill.bulkWrite(operations, { ordered: false });
  console.log(
    `Skills sincronizadas: ${result.upsertedCount} criadas, ${result.modifiedCount} atualizadas.`
  );
};

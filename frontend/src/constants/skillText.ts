import { STAT_LABEL } from "./trackVisuals";
import type { SkillResponse } from "../types/race";

export const RARITY_LABEL: Record<SkillResponse["rarity"], string> = {
  common: "Comum",
  rare: "Rara",
  unique: "Única"
};

const PHASE_LABEL: Record<string, string> = {
  any: "qualquer momento",
  opening: "largada",
  middle: "meio da prova",
  final: "reta final",
  spurt: "últimos 20%"
};

const TERRAIN_LABEL: Record<string, string> = {
  any: "qualquer terreno",
  uphill: "subida",
  downhill: "descida",
  corner: "curva",
  straight: "reta"
};

/**
 * Plain-language summary of what the race engine will do with this skill. `brief` drops
 * the single-turn duration, which is the default burst, so it fits on a small card.
 */
export const describeEffect = (skill: SkillResponse, { brief = false } = {}) => {
  const { kind, stat, value, duration } = skill.effect;
  const turns =
    duration > 1 || (duration === 1 && !brief)
      ? ` por ${duration} ${duration === 1 ? "turno" : "turnos"}`
      : "";

  switch (kind) {
    case "speedBoost":
      return `+${value} m/turno de velocidade${turns}`;
    case "startDash":
      return `+${value} m/turno na largada${turns}`;
    case "cornerBoost":
      return `+${value} m/turno nas curvas${turns}`;
    case "accelBoost":
      return `+${Math.round(value * 100)}% de aceleração${turns}`;
    case "staminaSave":
      return `-${Math.round(value * 100)}% de gasto de fôlego${turns}`;
    case "staminaRecover":
      return `recupera ${Math.round(value * 100)}% do fôlego`;
    case "inclineBoost":
      return `anula ${Math.round(value * 100)}% da perda em subida${turns}`;
    case "flatStat":
      return `+${value} de ${stat ? STAT_LABEL[stat] : "atributo"} durante a prova`;
    default:
      return `${kind} ${value}`;
  }
};

export const describeTrigger = (skill: SkillResponse) => {
  const parts = [PHASE_LABEL[skill.trigger.phase] ?? skill.trigger.phase];
  if (skill.trigger.terrain !== "any") {
    parts.push(TERRAIN_LABEL[skill.trigger.terrain] ?? skill.trigger.terrain);
  }
  if (skill.trigger.maxStaminaRatio !== undefined) {
    parts.push(`fôlego abaixo de ${Math.round(skill.trigger.maxStaminaRatio * 100)}%`);
  }
  if (skill.trigger.minPosition !== undefined) {
    parts.push(`do ${skill.trigger.minPosition}º lugar para trás`);
  }
  return parts.join(" · ");
};

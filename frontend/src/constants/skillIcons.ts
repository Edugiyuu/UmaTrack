import type { SkillResponse } from "../types/race";
import speedIcon from "../assets/skillIcons/speed.png";
import staminaIcon from "../assets/skillIcons/stamina.png";
import startIcon from "../assets/skillIcons/start.png";

/** The three icons drawn in the Figma: the start gate, the runner and the sparkle. */
const ICON_BY_KIND: Record<string, string> = {
  startDash: startIcon,
  accelBoost: startIcon,
  staminaRecover: staminaIcon,
  staminaSave: staminaIcon,
  flatStat: staminaIcon
};

export const skillIcon = (skill: SkillResponse) => ICON_BY_KIND[skill.effect.kind] ?? speedIcon;

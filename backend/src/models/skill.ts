import mongoose from "mongoose";

export const SKILL_EFFECT_KINDS = [
  "speedBoost",
  "accelBoost",
  "staminaRecover",
  "staminaSave",
  "startDash",
  "inclineBoost",
  "cornerBoost",
  "flatStat"
] as const;

export const SKILL_PHASES = ["any", "opening", "middle", "final", "spurt"] as const;
export const SKILL_TERRAINS = ["any", "uphill", "downhill", "corner", "straight"] as const;
export const SKILL_RARITIES = ["common", "rare", "unique"] as const;

export type SkillEffectKind = (typeof SKILL_EFFECT_KINDS)[number];
export type SkillPhase = (typeof SKILL_PHASES)[number];
export type SkillTerrain = (typeof SKILL_TERRAINS)[number];
export type SkillRarity = (typeof SKILL_RARITIES)[number];
export type StatName = "speed" | "stamina" | "power" | "wit";

const SkillEffectSchema = new mongoose.Schema({
  kind: { type: String, required: true, enum: SKILL_EFFECT_KINDS },
  /** Only used by `flatStat`: which stat receives the bonus. */
  stat: { type: String, required: false, enum: ["speed", "stamina", "power", "wit"] },
  /** Magnitude of the effect. Meaning depends on `kind` (see raceEngine). */
  value: { type: Number, required: true },
  /** How long the effect stays active, in turns. Ignored by instant effects. */
  duration: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

const SkillTriggerSchema = new mongoose.Schema({
  phase: { type: String, required: true, enum: SKILL_PHASES, default: "any" },
  terrain: { type: String, required: true, enum: SKILL_TERRAINS, default: "any" },
  /** Base activation chance per eligible turn, before the Wit bonus. */
  baseChance: { type: Number, required: true, min: 0, max: 1, default: 0.02 },
  /** Optional gate: only fires while stamina is at or below this fraction. */
  maxStaminaRatio: { type: Number, required: false, min: 0, max: 1 },
  /** Optional gate: only fires while sitting at or behind this placement. */
  minPosition: { type: Number, required: false, min: 1 }
}, { _id: false });

const SkillRequirementSchema = new mongoose.Schema({
  speed: { type: Number, required: true, min: 0, default: 0 },
  stamina: { type: Number, required: true, min: 0, default: 0 },
  power: { type: Number, required: true, min: 0, default: 0 },
  wit: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

const SkillSchema = new mongoose.Schema({
  slug: { type: String, required: true, trim: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  icon: { type: String, required: false, trim: true },
  rarity: { type: String, required: true, enum: SKILL_RARITIES, default: "common" },
  cost: { type: Number, required: true, min: 1 },
  effect: { type: SkillEffectSchema, required: true },
  trigger: { type: SkillTriggerSchema, required: true },
  /** Stat minimums the horse girl must reach before she can learn this skill. */
  requirements: { type: SkillRequirementSchema, required: true }
}, { timestamps: true });

export default mongoose.model("Skill", SkillSchema);

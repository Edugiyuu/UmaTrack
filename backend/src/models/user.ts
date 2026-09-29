import mongoose from "mongoose";

export const RUNNING_STYLES = ["front", "pace", "late", "end"] as const;
export type RunningStyle = (typeof RUNNING_STYLES)[number];

export const MAX_ENERGY = 100;

/** A skill the horse girl has already paid for, snapshotted so old races stay readable. */
const LearnedSkillSchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: false },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  learnedAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

export const CAREER_STATUSES = ["active", "completed", "failed"] as const;
export type CareerStatus = (typeof CAREER_STATUSES)[number];

/** One career race already run, kept so a retired horse still tells her story. */
const CareerResultSchema = new mongoose.Schema({
  raceIndex: { type: Number, required: true, min: 0 },
  trackSlug: { type: String, required: true },
  trackName: { type: String, required: true },
  goal: { type: Number, required: true, min: 1 },
  placement: { type: Number, required: true, min: 1 },
  fieldSize: { type: Number, required: true, min: 1 },
  passed: { type: Boolean, required: true },
  ranAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

/**
 * Where she is in her career calendar (src/data/careers.ts). `turnsLeft` on the horse
 * counts down to the race at `raceIndex`; once the career is over she is retired and
 * kept as a record.
 */
const CareerSchema = new mongoose.Schema({
  status: { type: String, required: true, enum: CAREER_STATUSES, default: "active" },
  raceIndex: { type: Number, required: true, min: 0, default: 0 },
  results: { type: [CareerResultSchema], required: true, default: [] },
  endedAt: { type: Date, required: false }
}, { _id: false });

const OwnedHorseSchema = new mongoose.Schema({
  sourceHorseId: { type: mongoose.Schema.Types.ObjectId, ref: "Horse", required: false },
  name: { type: String, required: true },
  passiveBuff: { type: String, required: false },
  stamina: { type: Number, required: true, min: 0 },
  power: { type: Number, required: true, min: 0 },
  speed: { type: Number, required: true, min: 0 },
  wit: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 1 },
  turnsLeft: { type: Number, required: true, min: 0, default: 5 },

  skillPoints: { type: Number, required: true, min: 0, default: 0 },
  skills: { type: [LearnedSkillSchema], required: true, default: [] },
  energy: { type: Number, required: true, min: 0, max: MAX_ENERGY, default: MAX_ENERGY },
  runningStyle: { type: String, required: true, enum: RUNNING_STYLES, default: "pace" },

  fans: { type: Number, required: true, min: 0, default: 0 },
  racesRun: { type: Number, required: true, min: 0, default: 0 },
  racesWon: { type: Number, required: true, min: 0, default: 0 },

  career: { type: CareerSchema, required: true, default: () => ({}) }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  horses: [OwnedHorseSchema],
  monies: { type: Number, required: true, min: 0, default: 1000 },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);

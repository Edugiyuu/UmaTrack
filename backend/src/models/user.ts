import mongoose from "mongoose";

export const RUNNING_STYLES = ["front", "pace", "late", "end"] as const;
export type RunningStyle = (typeof RUNNING_STYLES)[number];

export const MAX_ENERGY = 100;
export const MAX_MOOD = 5;

/** A skill the horse girl has already paid for, snapshotted so old races stay readable. */
const LearnedSkillSchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: false },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  learnedAt: { type: Date, required: true, default: Date.now }
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
  mood: { type: Number, required: true, min: 1, max: MAX_MOOD, default: 3 },
  runningStyle: { type: String, required: true, enum: RUNNING_STYLES, default: "pace" },

  fans: { type: Number, required: true, min: 0, default: 0 },
  racesRun: { type: Number, required: true, min: 0, default: 0 },
  racesWon: { type: Number, required: true, min: 0, default: 0 }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  horses: [OwnedHorseSchema],
  monies: { type: Number, required: true, min: 0, default: 1000 },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);

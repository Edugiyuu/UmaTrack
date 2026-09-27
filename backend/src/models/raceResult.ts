import mongoose from "mongoose";
import { RUNNING_STYLES } from "./user";

/**
 * A finished race. The replay frames are deliberately not stored: they are only
 * needed while the player watches the race, and keeping them would make the
 * collection grow very fast.
 */
const RaceResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: true },
  trackSlug: { type: String, required: true },
  trackName: { type: String, required: true },
  distance: { type: Number, required: true },

  horseName: { type: String, required: true },
  sourceHorseId: { type: mongoose.Schema.Types.ObjectId, ref: "Horse", required: false },
  runningStyle: { type: String, required: true, enum: RUNNING_STYLES },

  seed: { type: Number, required: true },
  placement: { type: Number, required: true, min: 1 },
  fieldSize: { type: Number, required: true, min: 1 },
  finishTime: { type: Number, required: true },
  /** Races run before the turn engine were timed in seconds. */
  timeUnit: { type: String, required: true, enum: ["seconds", "turns"], default: "seconds" },
  exhausted: { type: Boolean, required: true, default: false },
  skillsActivated: { type: [String], required: true, default: [] },

  statsSnapshot: {
    speed: { type: Number, required: true },
    stamina: { type: Number, required: true },
    power: { type: Number, required: true },
    wit: { type: Number, required: true }
  },

  prizeMoney: { type: Number, required: true, min: 0, default: 0 },
  skillPointsEarned: { type: Number, required: true, min: 0, default: 0 },
  fansEarned: { type: Number, required: true, min: 0, default: 0 },
  entryFee: { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });

export default mongoose.model("RaceResult", RaceResultSchema);

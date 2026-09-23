import mongoose from "mongoose";

export const TRACK_SURFACES = ["turf", "dirt"] as const;
export const TRACK_TERRAINS = ["flat", "incline", "rolling", "technical"] as const;
export const TRACK_CATEGORIES = ["sprint", "mile", "medium", "long"] as const;

export type TrackSurface = (typeof TRACK_SURFACES)[number];
export type TrackTerrain = (typeof TRACK_TERRAINS)[number];
export type TrackCategory = (typeof TRACK_CATEGORIES)[number];

/**
 * A stretch of the track. `grade` is the slope in percent: positive means uphill,
 * negative downhill. `curve` (0..1) is how tight the bend is. The `lengthRatio`
 * of every segment of a track must add up to 1.
 */
const TrackSegmentSchema = new mongoose.Schema({
  label: { type: String, required: true },
  lengthRatio: { type: Number, required: true, min: 0.01, max: 1 },
  grade: { type: Number, required: true, min: -12, max: 12, default: 0 },
  curve: { type: Number, required: true, min: 0, max: 1, default: 0 }
}, { _id: false });

const StatBlockSchema = new mongoose.Schema({
  speed: { type: Number, required: true, min: 0 },
  stamina: { type: Number, required: true, min: 0 },
  power: { type: Number, required: true, min: 0 },
  wit: { type: Number, required: true, min: 0 }
}, { _id: false });

const TrackSchema = new mongoose.Schema({
  slug: { type: String, required: true, trim: true, unique: true },
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  image: { type: String, required: false, trim: true },

  distance: { type: Number, required: true, min: 800, max: 4000 },
  category: { type: String, required: true, enum: TRACK_CATEGORIES },
  surface: { type: String, required: true, enum: TRACK_SURFACES },
  terrain: { type: String, required: true, enum: TRACK_TERRAINS },

  segments: {
    type: [TrackSegmentSchema],
    required: true,
    validate: {
      validator: (segments: { lengthRatio: number }[]) => {
        if (!segments.length) return false;
        const total = segments.reduce((sum, segment) => sum + segment.lengthRatio, 0);
        return Math.abs(total - 1) < 1e-6;
      },
      message: "A soma dos lengthRatio dos segmentos precisa ser 1"
    }
  },

  /** How much each stat matters on this track. Used by the race engine. */
  statWeights: { type: StatBlockSchema, required: true },
  /** Recommended minimums: running below them applies a speed penalty. */
  requirements: { type: StatBlockSchema, required: true },

  fieldSize: { type: Number, required: true, min: 2, max: 18, default: 8 },
  difficulty: { type: Number, required: true, min: 1, max: 10, default: 1 },
  entryFee: { type: Number, required: true, min: 0, default: 0 },
  /** Prize money per finishing position, index 0 is first place. */
  prizeMoney: { type: [Number], required: true, default: [] },
  fansReward: { type: Number, required: true, min: 0, default: 0 },
  skillPointReward: { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });

TrackSchema.virtual("maxGrade").get(function () {
  return this.segments.reduce((max, segment) => Math.max(max, segment.grade), 0);
});

TrackSchema.set("toJSON", { virtuals: true });
TrackSchema.set("toObject", { virtuals: true });

export default mongoose.model("Track", TrackSchema);

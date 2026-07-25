import mongoose from "mongoose";

const HorseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  passiveBuff: { type: String, required: false},
  stamina: { type: Number, required: true, min: 0 },
  power: { type: Number, required: true, min: 0 },
  speed: { type: Number, required: true, min: 0 },
  wit: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 1 },
}, { timestamps: true });

export default mongoose.model("Horse", HorseSchema);
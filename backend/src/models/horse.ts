import mongoose from "mongoose";

const HorseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passiveBuff: { type: String, required: false},
  stamina: { type: Number, required: true },
  power: { type: Number, required: true },
  speed: { type: Number, required: true },
  wit: { type: Number, required: true },
  cost: {type:Number,required:true},
}, { timestamps: true });

export default mongoose.model("Horse", HorseSchema);
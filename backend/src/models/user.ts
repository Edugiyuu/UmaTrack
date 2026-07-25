import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  horses: [{
    sourceHorseId: { type: mongoose.Schema.Types.ObjectId, ref: "Horse", required: false },
    name: { type: String, required: true },
    passiveBuff: { type: String, required: false},
    stamina: { type: Number, required: true, min: 0 },
    power: { type: Number, required: true, min: 0 },
    speed: { type: Number, required: true, min: 0 },
    wit: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 1 },
    turnsLeft: { type: Number, required: true, min: 0, default: 5 }
  }],
  monies: { type: Number, required: true, min: 0, default: 1000 },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
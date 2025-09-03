import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: false},
  password: { type: String, required: true },
  horses: [{
    name: { type: String, required: true },
    passiveBuff: { type: String, required: false},
    stamina: { type: Number, required: true },
    power: { type: Number, required: true },
    speed: { type: Number, required: true },
    wit: { type: Number, required: true }
  }],
  monies: { type: Number, required: true, default:1000},
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
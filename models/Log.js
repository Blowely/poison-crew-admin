import mongoose, {model, Schema, models} from "mongoose";

export const LogSchema = new Schema({
  title: String,
  spuId: String
}, {
  timestamps: true,
});

export const Log = models.Log || model('Log', LogSchema);
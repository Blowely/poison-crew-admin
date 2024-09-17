import mongoose, {model, Schema, models} from "mongoose";

export const SkusSchema = new Schema({
  spuId: Number,
  skuId: Number,
  detail: {type:Object},
  auth: {type:Object},
  isDeleted: Boolean
}, {
  timestamps: true,
});

export const Skus = models.Skus || model('Skus', SkusSchema);
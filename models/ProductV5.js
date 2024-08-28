import mongoose, {model, Schema, models} from "mongoose";

export const ProductV5Schema = new Schema({
  skuId: Number,
  spuId: Number,
  auth: {type:Object},
  isDeleted: Boolean
}, {
  timestamps: true,
});

export const ProductV5 = models.ProductV5 || model('ProductV5', ProductV5Schema);
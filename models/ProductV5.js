import mongoose, {model, Schema, models} from "mongoose";

export const ProductV5Schema = new Schema({
  spuId: Number,
  detail: {type:Object},
  auth: {type:Object},
  sizesAndPrices: Array,
  isDeleted: Boolean
}, {
  timestamps: true,
});

export const ProductV5 = models.ProductV5 || model('ProductV5', ProductV5Schema);
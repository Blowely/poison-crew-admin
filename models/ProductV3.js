import mongoose, {model, Schema, models} from "mongoose";

export const ProductV3Schema = new Schema({
  spuId: Number,
  title: String,
  description: String,
  titleDescription: String,
  country: String,
  price: Number,
  cheapestPrice: Number,
  brand: String,
  src: String,
  images: [{type:String}],
  sizesAndPrices: [{type:Object}],
  sizeInfoList: [{type:Object}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},
  isDeleted: Boolean
}, {
  timestamps: true,
});

export const ProductV3 = models.ProductV3 || model('ProductV3', ProductV3Schema);
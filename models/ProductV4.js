import mongoose, {model, Schema, models} from "mongoose";

export const ProductV4Schema = new Schema({
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
  brandId: Number,
  categoryName: String,
  categoryId: Number,
  level1CategoryId: Number,
  level2CategoryId: Number,
  auth: {type:Object},
  isDeleted: Boolean
}, {
  timestamps: true,
});

export const ProductV4 = models.ProductV4 || model('ProductV4', ProductV4Schema);
import mongoose, {model, Schema, models} from "mongoose";

export const ProductV3Schema = new Schema({
  title: String,
  description: String,
  titleDescription: String,
  country: String,
  price: Number,
  initial_price: String,
  brand: String,
  src: String,
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},
}, {
  timestamps: true,
});

export const ProductV3 = models.ProductV3 || model('ProductV3', ProductV3Schema);
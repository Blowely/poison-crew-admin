import mongoose, {model, Schema, models} from "mongoose";

export const ProductV2Schema = new Schema({
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

export const ProductV2 = models.ProductV2 || model('ProductV2', ProductV2Schema);
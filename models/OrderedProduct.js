import mongoose, {model, Schema, models} from "mongoose";

export const OrderedProductSchema = new Schema({
  title: {type:String, required:true},
  description: String,
  price: {type: String, required: true},
  size: {type: String, required: true},
  src: [{type:String}],
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},
}, {
  timestamps: true,
});
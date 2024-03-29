import mongoose, {model, Schema, models} from "mongoose";

export const ProductSchema = new Schema({
  title: {type:String, required:true},
  description: String,
  country: String,
  price: Number,
  initial_price: String,
  brand: String,
  src: [{type:String}],
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},
}, {
  timestamps: true,
});

export const Product = models.Product || model('Product', ProductSchema);
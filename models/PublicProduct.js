import mongoose, {model, Schema, models} from "mongoose";

export const PublicProductSchema = new Schema({
  title: {type:String, required:true},
  description: String,
  price: {type: Number, required: true},
  src: [{type:String}],
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
}, {
  timestamps: true,
});

export const PublicProduct = models.Product || model('Product', PublicProductSchema);
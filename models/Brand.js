import {model, models, Schema} from "mongoose";

const BrandSchema = new Schema({
  id: Number,
  name: String,
  originName: String,
  logo: String
});

export const Brand = models?.Brand || model('Brand', BrandSchema);
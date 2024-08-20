import mongoose, {model, models, Schema} from "mongoose";

const BrandSchema = new Schema({
  id: String,
  name: String,
  originName: String,
});

export const Brand = models?.Brand || model('Brand', BrandSchema);
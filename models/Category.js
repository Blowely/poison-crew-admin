import mongoose, {model, models, Schema} from "mongoose";

const CategorySchema = new Schema({
  id: String,
  name: String,
  originName: String,
});

export const Category = models?.Category || model('Category', CategorySchema);
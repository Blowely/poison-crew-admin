import {model, models, Schema} from "mongoose";

const CategorySchema = new Schema({
  id: Number,
  name: String,
  originName: String,
});

export const Category = models?.Category || model('Category', CategorySchema);
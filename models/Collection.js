import {model, Schema, models} from "mongoose";

const CollectionSchema = new Schema({
  name: {type:String, required:true},
  value: {type: Number, required: true},
}, {
  timestamps: true,
});

export const Collection = models.Collection || model('Collection', CollectionSchema);
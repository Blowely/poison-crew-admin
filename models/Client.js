import {model, Schema, models} from "mongoose";

const ClientSchema = new Schema({
  phone: {type:String, required:true},
  city:String,
  postalCode:String,
  streetAddress:String,
  country:String,
}, {
  timestamps: true,
});

export const Client = models.Client || model('Client', ClientSchema);
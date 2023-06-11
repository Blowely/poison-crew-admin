import {model, Schema, models} from "mongoose";

const ClientSchema = new Schema({
  phone: {type:String, required:true},
  token: String,
  userAgent: String,
  addresses: Object,
}, {
  timestamps: true,
});

export const Client = models.Client || model('Client', ClientSchema);
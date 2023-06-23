import {model, Schema, models} from "mongoose";
import {Address, AddressSchema} from "@/models/Address";

const ClientSchema = new Schema({
  phone: {type:String, required:true},
  token: String,
  userAgent: String,
  addresses: [AddressSchema],
  lastAddress: Number,
  cart: [String],
}, {
  timestamps: true,
});

export const Client = models.Client || model('Client', ClientSchema);
import {model, models, Schema} from "mongoose";
import {ProductSchema} from "@/models/Product";
import {Address, AddressSchema} from "@/models/Address";

const OrderSchema = new Schema({
  clientId: {type: String, required: true},
  products: [ProductSchema],
  address: {type: AddressSchema, required: true},
  email: String,
  paid: Boolean,
}, {
  timestamps: true,
});

export const Order = models?.Order || model('Order', OrderSchema);
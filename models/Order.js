import {model, models, Schema} from "mongoose";
import {Address, AddressSchema} from "@/models/Address";
import {OrderedProductSchema} from "@/models/OrderedProduct";

const OrderSchema = new Schema({
  clientId: {type: String, required: true},
  products: [OrderedProductSchema],
  address: {type: AddressSchema, required: true},
  email: String,
  paid: Boolean,
}, {
  timestamps: true,
});

export const Order = models?.Order || model('Order', OrderSchema);
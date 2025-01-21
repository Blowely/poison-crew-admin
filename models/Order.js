import {model, models, Schema} from "mongoose";
import {AddressSchema} from "@/models/Address";
import {OrderedProductSchema} from "@/models/OrderedProduct";

const OrderSchema = new Schema({
  clientId: {type: String, required: true},
  products: Array,
  price: Number,
  size: String,
  address: {type: AddressSchema, required: true},
  email: String,
  paid: Boolean,
  status: String,
  delivery_status: String,
}, {
  timestamps: true,
});

export const Order = models?.Order || model('Order', OrderSchema);
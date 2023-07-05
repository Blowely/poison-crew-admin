import {model, Schema, models} from "mongoose";

export const AddressSchema = new Schema({
  id: String,
  fio: {type:String, required:true},
  phone: {type:String, required:true},
  city: {type:String, required:true},
  address: {type:String, required:true},
  postalCode: {type:String, required:true},
  workschedule: String,
}, {
  timestamps: true,
});

export const Address = models.Address || model('Address', AddressSchema);
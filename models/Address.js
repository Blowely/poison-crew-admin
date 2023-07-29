import {model, Schema, models} from "mongoose";

export const AddressSchema = new Schema({
  id: String,
  type: String,
  fio: {type:String},
  phone: {type:String},
  city: {type:String},
  address: {type:String, required:true},
  postalCode: {type:String},
  workschedule: String,
  isArchived: {type: Boolean}
}, {
  timestamps: true,
});

export const Address = models.Address || model('Address', AddressSchema);
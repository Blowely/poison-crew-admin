import mongoose, {model, Schema, models} from "mongoose";

export const ProductV6Schema = new Schema({
  returnable: { type: Boolean },
  fit: { type: String, enum: ['MALE', 'FEMALE', 'UNISEX'] },
  spuId: { type: Number },
  split: {
    first: { type: Number },
    second: { type: Number }
  },
  price: { type: Number },
  slug: { type: String },
  images: { type: [String] },
  brand: { type: String },
  name: { type: String },
  availability: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE'] },
  skuId: { type: Number },
  category: {
    category1: { type: String },
    category2: { type: String },
    category3: { type: String }
  },
  series: {
    id: { type: Number },
    name: { type: String }
  },
  size: {
    primary: { type: String },
    us: { type: String },
    uk: { type: String },
    eu: { type: String },
    ru: { type: String }
  },
  fromAvailability: { type: Boolean },
  priceV2: {
    price: { type: Number },
    priceWithoutDiscount: { type: Number },
    discount: { type: Boolean },
    priceWithExpress: { type: Number },
    priceWithExpressWithoutDiscount: { type: Number },
    priceFromAvailability: { type: Number },
    previousPriceFromAvailability: { type: Number },
    discountFromAvailability: { type: Boolean }
  },
  maxPrice: { type: Number },
  metadata: {
    shoplaza: { type: Boolean }
  },
  deliveryTime: {
    min: { type: Number },
    max: { type: Number },
    expressMin: { type: Number },
    expressMax: { type: Number }
  }
}, {
  timestamps: true,
});

export const ProductV6 = models.ProductV6 || model('ProductV6', ProductV6Schema);
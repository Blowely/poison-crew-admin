import {model, models, Schema} from "mongoose";

const PromoSchema = new Schema({
    "value": String,
}, {timestamps: true});

export const Promo = models?.Promo || model('Promo', PromoSchema);
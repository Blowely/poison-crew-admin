import {model, Schema, models} from "mongoose";

export const LinkSchema = new Schema({
  link: String,
}, {
  timestamps: true,
});

export const Link = models.Link || model('Link', LinkSchema);
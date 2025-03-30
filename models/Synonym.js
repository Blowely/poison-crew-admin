import {model, models, Schema} from "mongoose";

const SynonymSchema = new Schema({
  "mappingType": String,
  "synonyms": Array,
}, {timestamps: true});

export const Synonym = models?.Synonym || model('Synonym', SynonymSchema);
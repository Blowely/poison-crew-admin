import {mongooseConnect} from "@/lib/mongoose";
import {Collection} from "@/models/Collection";
import axios from "axios";

export default async function handler(req,res) {
  await mongooseConnect();
  const {method, query} = req;

  //update collections
  if (method === 'POST') {
    const products = await axios('http://localhost:3000/api/products');

    const collections = {};

    products?.data?.items.map((el) => {
      if (collections[el.title]) {
        collections[el.title].value += 1;
      } else {
        collections[el.title] = {
          value: 1,
          name: el.title
        }
      }
    });


    Promise.all(Object.values(collections).map((el) => {
      new Promise(async (resolve) => {
        const res = await Collection.create(el)
        resolve(res);
      });
    })).then((response) => {
      console.log('response =', response);
      res.json(response);
    })
  }

  if (method === 'GET') {
    const limit = query?.limit;

    const response = await Collection.find().sort({value:-1}).limit(limit);
    res.json(response);
  }
}
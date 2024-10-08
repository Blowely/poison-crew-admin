import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";
import {exec} from "child_process";
import PQueue from 'p-queue';
import { setTimeout } from "timers/promises";

const phoneApi = 'http://192.168.1.205:8016';
const ahkScriptPath = '"C:/Users/Azerty/Desktop/ahk/parseProductsGoBackToServer.exe"';

// Создание очереди задач с лимитом параллельного выполнения


const queue = new PQueue({ concurrency: 1 });

function runAHKScript(src) {
  return new Promise((resolve, reject) => {
    const response = axios(`${phoneApi}/dewulink://m.dewu.com/note?routerUrl=${src}`);

    exec(ahkScriptPath, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing AHK script: ${error}`);
        reject(error);
      } else {
        console.log(`AHK script executed successfully. Output: ${stdout}`);
        await setTimeout(2500)
        resolve();
      }
    });
  });
}

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  if (method === 'GET') {
    try {
      //const {phone} = decryptToken(query?.token);
      const queryType = query?.type;

      //const client = phone ? await Client.findOne({phone}) : null;
      //let projection = (client || phone === '79223955429') ? {} : {properties: 0};

      let items = [];
      let totalCount = undefined;
      let result = undefined;

      const src = req.query?.src;
      console.log('src =',src);

      queue.add(() => runAHKScript(src));


      res.send('Request added to queue.');

    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  //await isAdminRequest(req,res);
  if (method === 'POST') {
    try {
      const {titleDescription,src} = req.body;

      const isExist = await ProductV3.findOne({src: src}) || undefined;
      console.log('isExist',isExist);

      if (isExist) {
        res.status(402);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }

      const productDoc = await ProductV3.create({
        titleDescription,src
      })
      res.status(200);
      res.json(productDoc);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: e});
    }
  }

  if (method === 'PUT') {
    try {
      const {
        title,
        description,
        price,
        src,
        images,
        category,
        properties,
        sizesAndPrices,
        cheapestPrice,
        sizeInfoList,
        _id,
        spuId,
        isDeleted
      } = req.body;

      const filter = !!_id ? {_id} : {spuId}
      const response = await ProductV3.updateOne(filter, {
        spuId,
        title,
        description,
        price,
        src,
        images,
        category,
        properties,
        sizesAndPrices,
        cheapestPrice,
        sizeInfoList,
        isDeleted
      });

      res.status(200);
      res.json({answer: response.data});
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'PATCH') {
    try {
      if (req.query?.id) {
        //await Product.deleteOne({_id:req.query?.id});
        res.json(true);
      }
   /* await Product.deleteMany({createdAt: {
        $gte: "2023-08-20T20:53:26.899Z",2023-08-20T22:19:35.142Z
        $lte: "2023-08-20T20:53:29.451Z"2023-08-20T22:19:35.162Z
      }});
    res.json(true);*/

    //  const items = await Product.find();
    //
    //  await Promise.all(items.map(async ({_id, title}) => {
    //    if (title.includes('adidas') || title.includes('Adidas') || title.includes('nike') || title.includes('Nike')) {
    //      return;
    //    }
    //    await Product.findOneAndUpdate({_id}, {title: `adidas ${title}`})
    //  }))
    //
    // console.log('items =',items)
    //
    // res.json({items});
    } catch (e) {
      console.log('e =11', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'DELETE') {
    try {

       const items = await ProductV2.aggregate([
         {
           $group: {
             _id: "$src", // Группировка по полю fieldName
             titleDescription: { "$first": "$titleDescription" },
             src: { "$first": "$src" },
             count: { $sum: 1 }, // Подсчёт количества документов для каждого значения поля
           }
         },
         {
           $match: {
             count: { $eq: 1 } // Выборка только тех, у которых count равно 1, то есть уникальные значения
           }
         }
       ]) || [];

       await Promise.all(items.map(async ({titleDescription, src}) => {

         await ProductV3.create({
           titleDescription,src, images: []
         })
       }))


      res.json({items});
    } catch (e) {
      console.log('e =12', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

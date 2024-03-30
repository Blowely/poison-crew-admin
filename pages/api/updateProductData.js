import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";
import async from "async";
import {exec} from "child_process";

const phoneApi = 'http://192.168.1.102:8015';
const ahkScriptPath = 'C:/Users/User/Desktop/ahk/parseProductsGoBackToServer.exe';

const visitProduct = async (src, callback) => {
  const response = await axios(`${phoneApi}/dewulink://m.dewu.com/note?routerUrl=${src}`);

  if (!response) {return;}

  exec(`"${ahkScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка при выполнении скрипта: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    callback()
  });
}


// Создание очереди задач с лимитом параллельного выполнения
const queue = async.queue(async (task, callback) => {
  // Здесь происходит выполнение API метода
  await visitProduct(task.src, callback);
}, 1); // Одновременно выполняется только одна задача

// Функция для добавления задачи в очередь
function addToQueue(src) {
  queue.push({ src });
}

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  if (method === 'GET') {
    try {
      const {phone} = decryptToken(query?.token);
      const queryType = query?.type;

      const client = phone ? await Client.findOne({phone}) : null;
      let projection = (client || phone === '79223955429') ? {} : {properties: 0};

      let items = [];
      let totalCount = undefined;
      let result = undefined;

      if (req.query?.id) {
        result = await ProductV3.findOne({_id: req.query.id}, projection);
      }

      const src = result?.src;
      const res = await visitProduct(src);

      const id = req.body;
      addToQueue(src); // Добавление запроса в очередь
      res.send('Request added to queue.');



      res.status(200);
      res.json(result);
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
      console.log('e =', e);
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
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

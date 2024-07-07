import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";

const updateLastProductData = 'https://27b9-91-236-247-248.ngrok-free.app/api/updateLastProductData';
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
      let result = [];

      if (req.query?.parse) {
        if (req.query?.src && req.query?.id) {
          return res.status(200).send('error: send src or product id');
        }

        let src = req.query?.src || undefined;

        if (req.query?.id) {
          const productId = req.query?.id
          const productData = await ProductV3.findOne({_id: productId}, projection);
          src = productData?.src;
        }

        axios(`${updateLastProductData}?src=${src}&token=${query?.token}`)
          .catch(() => console.log('updateProductFailed'));
      }

      if (req.query?.id) {
        const productData = await ProductV3.findOne({_id: req.query?.id}, projection);
        return res.status(200).json(productData);
      } else if (req.query?.src) {
        const productData = await ProductV3.find({src: req.query.src});
        return res.status(200).json(productData);
      } else {

        const collName = query?.collName;
        const search = query?.search;

        const buildRequest = ({category = ''}) => {
          const obj = {};

          if (collName && collName !== 'personal' && collName !== 'popular') {
            obj.title = new RegExp(req.query?.collName, "i");
          }

          if (search) {
            obj.title = new RegExp(search, "i");
          }

          if (category) {
            delete obj.title;
            obj.category = new RegExp('.*' + category + '.*');
          }

          // if (queryType !== 'admin') {
          //   obj.price = {$gt: 1}
          // }

          console.log('obj',obj);
          return obj;
        }


        items = await ProductV3.find(buildRequest({})).skip(req.query?.offset)
              .limit(req.query.limit);

        totalCount = await ProductV3.count(buildRequest({}));

        result = {items: items, total_count: totalCount }
      }

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
      const {titleDescription,src, spuId} = req.body;

      const isExist = await ProductV3.findOne({src: src});
      console.log('isExist',isExist);

      if (isExist) {
        res.status(200);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }

      const productDoc = await ProductV3.create({
        titleDescription,src, spuId
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
      },{upsert:true});

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

import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";
import { setTimeout } from "timers/promises";

const myHeaders = new Headers();
myHeaders.append("accept", "*/*");
myHeaders.append("accept-language", "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5");
myHeaders.append("baggage", "sentry-environment=production,sentry-release=7qf8i2f2wgMdRdh7SOvSo,sentry-public_key=c81dfd5bfbf092f4ca212fd07c0862ed,sentry-trace_id=b622116fb21a47048d0431071e2878d2,sentry-sample_rate=1,sentry-sampled=true");
myHeaders.append("cache-control", "no-cache");
myHeaders.append("cookie", "_ga=GA1.1.151431174.1710783172; _ym_uid=1710783173642692711; _ym_d=1710783173; _userGUID=0:ltx84otz:7FkwrkzJ0dTXKwPVhz3zJ9fcB~kbop84; gender=men; _ga_KDREW63Q0N=deleted; _ym_isad=1; _ym_visorc=w; dSesn=4acf8eda-b210-7c86-4805-11647e67def5; _dvs=0:lz1c1avn:oLd9wVm6OIusUquyv5~8~C1D0tQJ4kj0; digi_uc=W1sidiIsIjYwMzg5MTIwOCIsMTcyMTkxNTUxMDEyNl0sWyJ2IiwiNjA1ODkwMDk5IiwxNzIxOTA5NDUzNzQ5XSxbInYiLCI2MDA4NDQyNDIiLDE3MjE4Mzg2NjMwNDddLFsidiIsIjYxMzI5NTIzMCIsMTcyMTgxNjkyODQ3NV0sWyJ2IiwiMzE0NzU0NTM3IiwxNzIxNjUzMDQ2ODIxXSxbInYiLCI2MzE0NzE2NDAiLDE3MjE2NDc0NTEzNjFdLFsidiIsIjYwMDg0NDIzNiIsMTcyMTY0NzAwMjYwMl0sWyJ2IiwiNjExMDA5Njc2JnV0bV9jYW1wYWlnbj1Vbmljb3JuX0VQS19SZXRhcmdldF8yJTdDMTEzMDg2OTg2JnV0bV9jb250ZW50PTU0NzM3Mzg5OTIlN0MxODQ4MzI1OTA2NTMyNzQ4MzQ4JnV0bV9tZWRpdW09Y3BjJnV0bV9zb3VyY2U9eWFuZGV4JnV0bV90ZXJtPSU3QzczNzAxNTY1JnljbGlkPTE3Njk1ODgwNzUyMDA5MDUyMTU5IiwxNzIxNjQ2NTk0NzA5XSxbInYiLCI2MTAyNjA2NDImdXRtX2NhbXBhaWduPVVuaWNvcm5fRVBLX1JldGFyZ2V0XzIlN0MxMTMwODY5ODYmdXRtX2NvbnRlbnQ9NTQ3MzczODk5MiU3QzE4NDgzMjU5MDY1MzI3NDgzNDgmdXRtX21lZGl1bT1jcGMmdXRtX3NvdXJjZT15YW5kZXgmdXRtX3Rlcm09JTdDNzM3MDE1NjUmeWNsaWQ9MTc2OTU4ODA3NTIwMDkwNTIxNTkiLDE3MjE1NzY4MTYzMTldLFsidiIsIjYxMDI2MDYzOSZ1dG1fc291cmNlPXlhbmRleCZ1dG1fbWVkaXVtPWNwYyZ1dG1fY2FtcGFpZ249VW5pY29ybl9FUEtfUmV0YXJnZXRfMnwxMTMwODY5ODYmdXRtX2NvbnRlbnQ9NTQ3MzczODk5MnwxODQ4MzI1OTA2NTMyNzQ4MzQ4JnV0bV90ZXJtPXw3MzcwMTU2NSZ5Y2xpZD0xNzY5NTg4MDc1MjAwOTA1MjE1OSIsMTcyMTU3NjgwMjYyM10sWyJ2IiwiNjAwMDEyNjYxIiwxNzIxOTE1NTU0MjEyXV0=; _ga_KDREW63Q0N=GS1.1.1721915510.102.1.1721915554.16.0.2085969482");
myHeaders.append("pragma", "no-cache");
myHeaders.append("priority", "u=1, i");
myHeaders.append("sec-ch-ua", "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"");
myHeaders.append("sec-ch-ua-mobile", "?0");
myHeaders.append("sec-ch-ua-platform", "\"Windows\"");
myHeaders.append("sec-fetch-dest", "empty");
myHeaders.append("sec-fetch-mode", "cors");
myHeaders.append("sec-fetch-site", "same-origin");
myHeaders.append("sentry-trace", "b622116fb21a47048d0431071e2878d2-b9b4aa63a8421172-1");
myHeaders.append("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

const updateLastProductData = 'https://23d4-91-236-247-240.ngrok-free.app/api/updateLastProductData';
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
        if (req.query?.spuId) {
          const response = await fetch(`https://unicorngo.ru/api/catalog/product/${req.query?.spuId}`, requestOptions).catch((error) => console.error(error));

          if (!response.ok) {
            return res.status(404).json({text:'miss product'});
          }

           axios(`${updateLastProductData}?spuId=${req.query?.spuId}&token=${query?.token}`)
            .catch(() => console.log('updateProductFailed'));
           await setTimeout(1000)
           return res.status(200).json({text:'request added to queue'});
        }

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

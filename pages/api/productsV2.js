import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";

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

      if (req.query?.id) {
        result = await Product.findOne({_id: req.query.id}, projection);
      } else {

        const collName = query?.collName;
        const search = query?.search;

        const buildRequest = ({category = ''}) => {
          const obj = {};

          if (collName && collName !== 'personal' && collName !== 'popular') {
            obj.title = new RegExp('.*' + req.query?.collName + '.*');
          }

          if (search) {
            obj.title = new RegExp('.*' + search + '.*');
          }

          if (category) {
            delete obj.title;
            obj.category = new RegExp('.*' + category + '.*');
          }

          if (queryType !== 'admin') {
            obj.price = {$gt: 1}
          }

          console.log('obj',obj);
          return obj;
        }


        items = await ProductV2.find(buildRequest({})).skip(req.query?.offset)
              .limit(req.query.limit);

        totalCount = await ProductV2.count(buildRequest({}));

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
      const {titleDescription,src} = req.body;

      const isExist = await ProductV2.findOne({src: src}) || undefined;
      console.log('isExist',isExist);

      if (isExist) {
        res.status(402);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }

      const productDoc = await ProductV2.create({
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
      const {title,description,price,src, images,category,properties,_id} = req.body;
      await Product.updateOne({_id}, {title,description,price,src,images,category,properties});

      res.status(200);
      res.json(true);
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
}

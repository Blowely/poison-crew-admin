import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  if (method === 'GET') {
    try {
      const {phone} = decryptToken(query?.token);
      const type = query?.type;

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

        const buildRequest = () => {
          const obj = type === 'admin'
              ? {}
              : {
                price: {$gte: 1}
              };

          if (collName && collName !== 'personal' && collName !== 'popular') {
            obj.title = req.query?.collName;
          }

          if (search) {
            obj.title = new RegExp('.*' + search + '.*');
          }

          return obj;
        }

        if ((collName === 'personal' || collName === 'popular') && !search) {
          //random = Math.floor(Math.random() * count)

          items = await Product.aggregate([{$match: buildRequest()},{ $sample: { size: 20 } }]);

        } else {
          items = await Product.find(buildRequest(), {properties: 0}).skip(req.query?.offset)
              .limit(req.query.limit);
        }

        totalCount = await Product.count(buildRequest());

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
    const {title,description,price,src, images, category,properties} = req.body;
    const productDoc = await Product.create({
      title,description,price,src,images,category,properties,
    })
    res.json(productDoc);
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

  if (method === 'DELETE') {
    if (req.query?.id) {
      //await Product.deleteOne({_id:req.query?.id});
      res.json(true);
    }
    /*await Product.deleteMany({createdAt: {
        $gte: "2023-08-20T20:38:10.998Z",
        $lte: "2023-08-20T20:38:11.022Z"
      }});
    res.json(true);*/

  }
}

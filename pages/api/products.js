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

      const client = phone ? await Client.findOne({phone}) : null;
      let projection = (client || phone === '79223955429') ? {} : {properties: 0};

      let items = [];
      let totalCount = undefined;
      let result = [];

      if (req.query?.id) {
        result = await Product.findOne({_id: req.query.id}, projection);
      } else {
        const filterObj = {}

        if (req.query?.collName) {
          filterObj.title = req.query?.collName;
        }

        totalCount = await Product.count(filterObj);
        items = await Product.find(filterObj, {properties: 0}).skip(req.query?.offset)
          .limit(req.query.limit);

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
    const {title,description,price,src,category,properties} = req.body;
    const productDoc = await Product.create({
      title,description,price,src,images,category,properties,
    })
    res.json(productDoc);
  }

  if (method === 'PUT') {
    const {title,description,price,src, images,category,properties,_id} = req.body;
    await Product.updateOne({_id}, {title,description,price,src,images,category,properties});
    res.json(true);
  }

  if (method === 'DELETE') {
    if (req.query?.id) {
      await Product.deleteOne({_id:req.query?.id});
      res.json(true);
    }
  }
}
import {Product} from "@/models/Product";
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  const {method} = req;
  await mongooseConnect();

  if (method === 'GET') {
    let items = [];
    let totalCount = undefined;
    let result = [];

    if (req.query?.id) {
      result = await Product.findOne({_id: req.query.id});
    } else {
      totalCount = await Product.count();
      items = await Product.find().skip(req.query?.offset)
        .limit(req.query.limit);
      result = {items: items, total_count: totalCount }
    }

    res.json(result);
  }

  await isAdminRequest(req,res);
  if (method === 'POST') {
    const {title,description,price,images,category,properties} = req.body;
    const productDoc = await Product.create({
      title,description,price,images,category,properties,
    })
    res.json(productDoc);
  }

  if (method === 'PUT') {
    const {title,description,price,images,category,properties,_id} = req.body;
    await Product.updateOne({_id}, {title,description,price,images,category,properties});
    res.json(true);
  }

  if (method === 'DELETE') {
    if (req.query?.id) {
      await Product.deleteOne({_id:req.query?.id});
      res.json(true);
    }
  }
}
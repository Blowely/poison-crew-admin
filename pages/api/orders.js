import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";

export default async function handler(req,res) {
  const {method} = req;
  await mongooseConnect();

  if (method === 'GET') {
    res.json(await Order.find().sort({createdAt:-1}));
  }

  if (method === 'POST') {
    try {
      const {clientId, products, address} = JSON.parse(req.body);

      const client = await Client.findOne({_id: clientId});
      const selectedProducts = await Product.find({
        _id: {
          $in: products.map(el => el._id)
        }}
      );


      if (!client) {
        res.json({status: 'clientNotFoundOrDeleted', message: 'Клент не найден или удален'});
        return res.status(404);
      }

      if (!selectedProducts.length) {
        res.json({status: 'productNotFoundOrDeleted', message: 'Товар не найден или удален'});
        return res.status(404);
      }

      const postData = {
        clientId,
        products: selectedProducts,
        address,
        email: '',
        paid: true
      }

      const response = await Order.create(postData)
      res.json({status: 'ok', message: 'заказ оформлен'});
      res.status(200);
    } catch (e) {
      console.log('e =', e);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
      res.status(500);
    }
  }
}

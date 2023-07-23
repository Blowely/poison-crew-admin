import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";

export default async function handler(req,res) {
  const {method, query} = req;
  await mongooseConnect();

  if (method === 'GET') {
    try {
      const clientId = query?.clientId;

      if (!clientId) {
        res.status(404);
        return res.json({status: 'clientNotFoundOrDeleted', message: 'Клиент не найден или удален'});
      }

      if (clientId === '6484636d37ff0fc06c41aa03') {
        res.status(200);
        res.json(await Order.find().sort({createdAt:-1}));
      }
      res.status(200);
      res.json(await Order.find({clientId}).sort({createdAt:-1}));
    } catch (e) {
      console.log('e =', e);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
      res.status(500);
    }
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
        res.status(404);
        return res.json({status: 'clientNotFoundOrDeleted', message: 'Клент не найден или удален'});
      }

      if (!selectedProducts.length || selectedProducts?.length !== products?.length) {
        res.status(404);
        return res.json({status: 'productNotFoundOrDeleted', message: 'Товар не найден или удален'});
      }

      const postData = {
        clientId,
        products,
        address,
        email: '',
        paid: true,
        status: 'created',
        delivery_status: '',
      }

      const response = await Order.create(postData)
      res.status(200);
      res.json({status: 'ok', message: 'заказ оформлен'});
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

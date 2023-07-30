import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";
import axios from "axios";

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

      const response = await Order.create(postData);
      console.log('response=', response);
      let totalPrice = 0;

      const deliveryCost = 1700 * (products?.length || 1)

      axios.post('https://api.telegram.org/bot5815209672:AAGETufx2DfZxIdsm1q18GSn_bLpB-2-3Sg/sendMessage', {
        chat_id: 664687823,
        text:`
        ---NEW ORDER---\n
        id: ${response._id}\n
        ${products.map(el => {
          totalPrice += Math.ceil(Number(el?.price) * 13.3 + 1000);
          return `${el?.title} (${el?.size}) - ${el?.price} CNY;\n
            ${el?.src[0]}\n
          `;
        })} 
        totalPrice(RUB): ${totalPrice + deliveryCost}\n
        https://api.re-poizon.ru/orders\n`
      });

      res.status(200);
      res.json({status: 'ok', message: 'заказ оформлен'});
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'PATCH') {
    try {
      const _id = query?.orderId;

      const order = await Order.findOne({_id});
      const products = order?.products;
      const newProduct = await Product.findOne({_id: products[0]._id});
      const copyNewProduct = JSON.parse(JSON.stringify(newProduct));
      copyNewProduct.size = products[0]?.size

      await Order.updateOne({_id}, {products: [copyNewProduct]});

      res.status(200);
      res.json({status: 'ok', message: 'заказ изменен'});
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

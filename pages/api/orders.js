import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";
import {Collection} from "@/models/Collection";

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
      const selectedProducts = [];


      Promise.all(products.map((el) => {
        new Promise(async (resolve,reject) => {
          console.log('el=', el);
          const product = await Product.findOne({_id: el._id});
          console.log('dbproduct =', product)
          resolve(product);
         
        });
      })).then((response) => {
        selectedProducts.push(response);
        console.log('response =', response);
      }).catch((error) => {
        selectedProducts.push({id: error?.id,status: 'productNotFoundOrDeleted', message: 'Товар не найден или удален'});
        console.log('Catch err =', error);
      })

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
      console.log('FinishResponse =', response);
      res.json({status: 'ok', message: 'заказ оформлен'});
      res.status(200);
    } catch (e) {
      console.log('e =', e);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
      res.status(500);
    }
  }
}

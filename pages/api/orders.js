import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import axios from "axios";
import {ProductV6} from "@/models/ProductV6";
import {generateUniqueId} from "@/common/utils";

const login = async () => {
  try {
    const response = await axios.post('https://identity.authpoint.pro/api/v1/public/login', {
      login: 'repoizonstore@gmail.com',
      password: 'aZ4G8MnF'
    });

    return response.data.accessToken;
  } catch (error) {
    console.error('Authorization error:', error.message);
  }
};

const createOrder = async (amount, localOrderId, token) => {
  try {
    const response = await axios.post('https://pay.advancedpay.net/api/v1/order', {
      merchantOrderId: localOrderId,
      orderAmount: Number(`${amount}00`),
      orderCurrency: 'RUB',
      tspId: 483,
      description: 'Оплата через СБП',
      callbackUrl: 'https://re-poizon.ru/callback'
    }, {
      headers: {
        'Authorization-Token': token,
        'x-req-id': generateUniqueId()
      }
    });

    //console.log('response.data.order.id',response.data.order.id);
    if (!response?.data?.order?.id) {
      throw new Error('Ошибка создания заказа')
    }

    return response.data.order.id;
  } catch (error) {
    console.error('Order creation error:', JSON.stringify(error));
  }
};

const generateQR = async (orderId, token, phone, dbOrderId) => {
  try {
    const response = await axios.post(`https://pay.advancedpay.net/api/v1/order/qrcData/${orderId}`, {
      phoneNumber: phone
    }, {
      headers: {
        'Authorization-Token': token,
        'x-req-id': generateUniqueId()
      }
    });

    startStatusPolling(orderId, token, dbOrderId);
    return response.data.order.payload;
  } catch (error) {
    console.error('QR generation error:', error.message);
  }
};

const startStatusPolling = (orderId, token, dbOrderId) => {
  const interval = setInterval(async () => {
    try {
      const response = await axios.get(`https://pay.advancedpay.net/api/v1/status/${orderId}`, {
        headers: {
          'Authorization-Token': token
        }
      });

      const status = response.data.order.status;

      if (['IPS_ACCEPTED', 'DECLINED', 'EXPIRED'].includes(status)) {
        clearInterval(interval);

        // Обновляем статус заказа в базе данных
        await Order.updateOne(
            { _id: dbOrderId },
            {
              $set: {
                status: status === 'IPS_ACCEPTED' ? 'paid' : 'canceled',
                paid: status === 'IPS_ACCEPTED',
                delivery_status: status === 'IPS_ACCEPTED' ? 'processing' : ''
              }
            }
        );

        // Можно добавить уведомление в Telegram о изменении статуса
        if (status === 'IPS_ACCEPTED') {
          await axios.post('https://api.telegram.org/bot5815209672:AAGETufx2DfZxIdsm1q18GSn_bLpB-2-3Sg/sendMessage', {
            chat_id: 664687823,
            text: `Заказ #${dbOrderId} успешно оплачен`
          });
        }
      }

      return status;
    } catch (error) {
      console.error('Status check error:', error);
    }
  }, 5000);
};

export default async function handler(req,res) {
  await mongooseConnect();
  const {method, query} = req;

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

      // Проверяем наличие товаров
      if (!products || !products.length) {
        res.status(400);
        return res.json({status: 'emptyCart', message: 'Корзина пуста'});
      }

      const client = await Client.findOne({_id: clientId});
      if (!client) {
        res.status(404);
        return res.json({status: 'clientNotFoundOrDeleted', message: 'Клиент не найден или удален'});
      }

      // Обрабатываем все товары
      const processedProducts = [];
      let totalPrice = 0;

      for (const product of products) {
        const selectedProduct = await ProductV6.findOne({spuId: product.spuId});
        if (!selectedProduct) {
          res.status(404);
          return res.json({
            status: 'productNotFoundOrDeleted',
            message: `Товар ${product.spuId} не найден или удален`
          });
        }

        let selectedSizeIndex = selectedProduct.skus.findIndex(
            sku => sku.size?.eu === product.selectedSize
        );

        const sizeProperty = selectedProduct.properties?.propertyTypes?.find(
            el => el?.name === 'Размер'
        );

        if (selectedSizeIndex < 0) {
          selectedSizeIndex = sizeProperty?.values?.findIndex(
              p => p?.value === product.selectedSize
          );
        }

        const selectedSize = selectedProduct.skus[selectedSizeIndex];
        const isStandardCheck = () => {
          if (selectedSize?.size?.eu || sizeProperty?.values[selectedSizeIndex]?.value) {
            return null;
          }
          return selectedProduct.skus?.length === 1 && selectedProduct.skus[0].price
              ? 'Стандарт'
              : null;
        }

        const price = selectedSize?.price;
        if (!price) {
          res.status(400);
          return res.json({
            status: 'invalidPrice',
            message: `Неверная цена для товара ${product.spuId}`
          });
        }

        processedProducts.push({
          product: selectedProduct,
          price,
          size: selectedSize?.size?.eu
              || sizeProperty?.values[selectedSizeIndex]?.value
              || isStandardCheck(),
          count: product?.count || "1"
        });

        totalPrice += price * product?.count || "1";
      }

      // Создаем заказ
      const postData = {
        clientId,
        products: processedProducts,
        address,
        totalPrice,
        email: '',
        paid: false,
        status: 'created',
        delivery_status: 'created',
      }

      const response = await Order.create(postData);

      // Платежная система
      /*const token = await login();
      const orderId = await createOrder(totalPrice, response._id, token);
      const qrCode = await generateQR(orderId, token, address?.phoneNumber || '', response._id);*/

      // Уведомление в Telegram
      const productList = processedProducts.map(p =>
          `${p.product.name} (${p.size}) - ${p.price * p?.count} (${p?.count}) RUB;\n${p.product.images[0]}\n`
      ).join('\n');

      await axios.post('https://api.telegram.org/bot5815209672:AAGETufx2DfZxIdsm1q18GSn_bLpB-2-3Sg/sendMessage', {
        chat_id: 664687823,
        text: `
          ---NEW ORDER---
          ID: ${response._id}
          Товары:
          ${productList}
          Общая сумма: ${totalPrice} RUB
          https://api.re-poizon.ru/orders
        `.trim()
      });

      res.status(200);
      res.json({
        status: 'ok',
        message: 'Заказ оформлен',
        orderId: response._id,
        qrCode: '',
        totalPrice
      });

    } catch (e) {
      console.error('Ошибка создания заказа:', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'PATCH') {
    try {
      const _id = query?.orderId;

      const order = await Order.findOne({_id});
      const products = order?.products;
      const newProduct = await ProductV6.findOne({_id: products[0]._id});
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

import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import axios from "axios";
import {ProductV6} from "@/models/ProductV6";
import {generateUniqueId} from "@/common/utils";
import {Promo} from "@/models/Promo";

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
      callbackUrl: 'https://re-poizon.ru/orders'
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

/**
 * Выплата на карту
 */
const payoutToCard = async (payoutData, token) => {
  try {
    const response = await axios.post(
        `https://pay.advancedpay.net/api/v1/payments/cards/payout`,
        payoutData,
        {
          headers: {
            'Authorization-Token': token,
            'x-req-id': generateUniqueId()
          }
        }
    );

    return response.data;
  } catch (error) {
    console.error('Payout error:', error.message);
    throw error;
  }
};

/**
 * Запрос на создание заказа по форме оплаты
 */
const cardPayment = async (orderId, tspCode, token)=>{
  try{
    const response =  await axios.post(`https://pay.advancedpay.net/api/v1/public/order/form/${tspCode}/${orderId}`,
        {},
        {
          headers: {
            'Authorization-Token': token,
            'x-req-id': generateUniqueId()
          }
        });
    // Подправить ретюрн. есть сомнения.доразбораться
    return response.data.externalOrderId;
  } catch(error){
    console.error('Payment form creation error:', error.message);
  }
};

/**
 * authorize - Холдирование средств
 */
const authorizePayment = async (orderId, cardData, token) => {
  try{
    const requestData = {
      OrderId: orderId,
      Card: {
        Pan: cardData.pan,
        ExpiryMonth: cardData.expiryMonth,
        ExpiryYear: cardData.expiryYear,
        cvv: cardData.cvv,
        Holder: cardData.holder,
        Phone: cardData.phone
      }
    }

    const response  = await axios.post(`https://pay.advancedpay.net/api/v1/payments/cards/authorize`,
        requestData,
        {
          headers: {
            'Authorization-Token': token,
            'x-req-id': generateUniqueId()
          }
        }
    );

    return response.data;
  } catch(error){
    console.error('Payment authorization error:', error.message);
  }
};

/**
 * charge - Списание средств
 */
const chargePayment = async (orderId, token) => {
  try{
    const response = await axios.post(`https://pay.advancedpay.net/api/v1/payments/cards/charge`,
        { OrderId: orderId },
        {
          headers: {
            'Authorization-Token': token,
            'x-req-id': generateUniqueId()
          }
        });

    return response.data;
  } catch(error){
    console.error('Payment charge error:', error.message);
  }
}

/**
 * Отмена холдирования средств
 */
const voidPayment = async (orderId, token) => {
  try {
    const response = await axios.post(`https://pay.advancedpay.net/api/v1/payments/cards/void`,
        { OrderId: orderId },
        {
          headers: {
            'Authorization-Token': token,
            'x-req-id': generateUniqueId()
          }
        }
    );

    return response.data;
  } catch (error) {
    console.error('Void payment error:', error.message);
  }
};

const getRemoteDiscount = async (code) => {
  const promo = await Promo.findOne({value: code.toUpperCase()})
  if (!promo?.value) return null;

  return promo.discount;
}

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
      const {clientId, products, address, promo, paymentMethod} = JSON.parse(req.body);
      const tspCode = 483;

      if (!['qr', 'card', 'payout'].includes(paymentMethod)) {
        return res.status(400).json({
          status: 'invalidPaymentMethod',
          message: 'Указан неверный способ оплаты. Доступно: qr, card, payout'
        });
      }


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
            sku => sku.skuId === product.skuId
        );

        const selectedSize = selectedProduct.skus[selectedSizeIndex];

        let price = selectedSize?.price;

        if (!price || price !== product.price) {
          if (!promo) {
            res.status(400);
            return res.json({
              status: 'invalidPrice',
              message: `Неверная цена для товара ${product.spuId}`
            });
          }
        }

        if (promo) {
         const remoteDiscount = await getRemoteDiscount(promo);
         const discountedPrice = Math.trunc(price * (1 - `0.${remoteDiscount}`));

         if (discountedPrice !== product?.discountedPrice) {
           res.status(400);
           return res.json({
             status: 'invalidDiscountPrice',
             message: `Неверная цена для товара ${product.spuId} discountedPrice`
           });
         }

          price = discountedPrice;
        }

        processedProducts.push({
          product: selectedProduct,
          price,
          size: product?.selectedSize || null,
          skuId: product?.skuId || null,
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
      const token = await login();
      const orderId = await createOrder(totalPrice, response._id, token);

      let paymentPayload = null;
      let authResult = null;

      if (paymentMethod === 'qr'){
        paymentPayload = await generateQR(orderId, token, address?.phoneNumber || '', response._id);
      }
      else if (paymentMethod === 'card'){
        const externalOrderId = await cardPayment(orderId, tspCode, token);

        const cardData = {
          pan: address?.cardNumber,       // Номер карты (из запроса или формы)
          expiryMonth: address?.expiryMonth, // Месяц окончания карты
          expiryYear: address?.expiryYear,   // Год окончания карты
          cvv: address?.cvv,              // CVV карты
          holder: address?.holderName,    // Имя держателя карты
          phone: address?.phoneNumber     // Телефон клиента
        };

        if (!cardData.pan || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv || !cardData.holder) {
          return res.status(400).json({
            status: 'cardDataIncomplete',
            message: 'Не все данные карты предоставлены для оплаты'
          });
        }

        // Холдирование
        const authResult = await authorizePayment(externalOrderId, cardData, token);

        if (!authResult.Response?.Success) {
          return res.status(400).json({
            status: 'authorization_failed',
            message: 'Ошибка авторизации платежа',
            details: authResult?.Response
          });
        }

        // Списание
        const chargeResult = await chargePayment(externalOrderId, token);

        if (!chargeResult?.Response?.Success) {
          await voidPayment(externalOrderId, token);
          return res.status(400).json({
            status: 'charge_failed',
            message: 'Ошибка списания средств. Холдирование отменено.',
            details: chargeResult?.Response
          });
        }

        // Успешно списано
        paymentPayload = {
          externalOrderId,
          paymentFormUrl: `https://payment.pay.advancedpay.net/${externalOrderId}`
        };
      }
      else if (paymentMethod === 'payout') {
        const cardData = {
          pan: address?.cardNumber,
          expiryMonth: address?.expiryMonth,
          expiryYear: address?.expiryYear,
          holder: address?.holderName,
          phone: address?.phoneNumber
        };

        if (!cardData.pan || !cardData.expiryMonth || !cardData.expiryYear || !cardData.holder) {
          return res.status(400).json({
            status: 'cardDataIncomplete',
            message: 'Не все данные карты предоставлены для выплаты'
          });
        }

        const payoutAmount = Number(`${totalPrice}00`); // Сумма в копейках

        const payoutData = {
          OrderId: generateUniqueId(), // Уникальный ID для выплаты
          Amount: payoutAmount,
          Card: cardData,
          Description: `Выплата за заказ ${response._id}`
        };

        const payoutResult = await payoutToCard(payoutData, token);

        if (!payoutResult?.Response?.Success) {
          return res.status(400).json({
            status: 'payout_failed',
            message: 'Ошибка выплаты на карту',
            details: payoutResult?.Response
          });
        }

        paymentPayload = {
          payoutId: payoutData.OrderId,
          status: 'payout_successful'
        };

        // Можно обновить статус заказа в БД, например как "refunded" или "payout_done"
        await Order.updateOne(
            { _id: response._id },
            {
              $set: {
                status: 'payout_done',
                paid: true,
                delivery_status: 'completed'
              }
            }
        );
      }

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
        paymentMethod,
        paymentPayload,
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

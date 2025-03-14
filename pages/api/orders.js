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
    console.error('Authorization error:', error);
  }
};

const createOrder = async (amount, token) => {
  try {
    const response = await axios.post('https://pay.advancedpay.net/api/v1/order', {
      merchantOrderId: `order_${Date.now()}`,
      orderAmount: amount,
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
    console.log('response.data.order.id',response.data.order.id);
    return response.data.order.id;
  } catch (error) {
    console.error('Order creation error:', error);
  }
};

const generateQR = async (orderId, token, phone) => {
  try {
    const response = await axios.post(`https://pay.advancedpay.net/api/v1/order/qrcData/${orderId}`, {
      phoneNumber: phone
    }, {
      headers: {
        'Authorization-Token': token,
        'x-req-id': generateUniqueId()
      }
    });

    //startStatusPolling(orderId, token);
    return response.data.order.payload;
  } catch (error) {
    console.error('QR generation error:', error);
  }
};

const startStatusPolling = (orderId, token) => {
  const interval = setInterval(async () => {
    try {
      const response = await axios.get(`/status/${orderId}`, {
        headers: {
          'Authorization-Token': token
        }
      });

      if (['IPS_ACCEPTED', 'DECLINED', 'EXPIRED'].includes(response.data.order.status)) {
        clearInterval(interval);
      }

      return response.data.order.status;
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

      const spuId = products[0].spuId;
      const client = await Client.findOne({_id: clientId});
      const selectedProduct = await ProductV6.findOne({spuId});

      if (!client) {
        res.status(404);
        return res.json({status: 'clientNotFoundOrDeleted', message: 'Клент не найден или удален'});
      }

      if (!selectedProduct) {
        res.status(404);
        return res.json({status: 'productNotFoundOrDeleted', message: 'Товар не найден или удален'});
      }

      let selectedSizeIndex = selectedProduct?.skus.findIndex(sku => sku.size?.eu === products[0]?.selectedSize);

      const sizeProperty = selectedProduct?.properties?.propertyTypes?.find(el => el?.name === 'Размер');

      if (selectedSizeIndex < 0) {
        selectedSizeIndex = sizeProperty?.values?.findIndex(p => p?.value === products[0]?.selectedSize);
      }

      const selectedSize = selectedProduct.skus[selectedSizeIndex];

      const isStandardCheck = () => {
        if (selectedSize?.size?.eu || sizeProperty?.values[selectedSizeIndex]?.value) {
          return null;
        }

        return selectedProduct?.skus?.length === 1 && selectedProduct?.skus[0].price ? 'Стандарт' : null;
      }

      const postData = {
        clientId,
        products: [selectedProduct],
        address,
        price: selectedSize?.price,
        size: selectedSize?.size?.eu
            || sizeProperty?.values[selectedSizeIndex]?.value
            || isStandardCheck(),
        email: '',
        paid: false,
        status: 'created',
        delivery_status: '',
      }

      const price = selectedSize?.price;

      const token = await login();
      const orderId = await createOrder(price, token);
      const qrCode = await generateQR(orderId, token, address?.phoneNumber || '');

      const response = await Order.create(postData);

      axios.post('https://api.telegram.org/bot5815209672:AAGETufx2DfZxIdsm1q18GSn_bLpB-2-3Sg/sendMessage', {
        chat_id: 664687823,
        text:`
        ---NEW ORDER---\n
        id: ${response._id}\n
        ${products.map(el => {
          return `${el?.name} (${el?.selectedSize}) - ${price} RUB;\n
            ${el?.images[0]}\n
          `;
        })} 
        totalPrice(RUB): ${price}\n
        https://api.re-poizon.ru/orders\n`
      });

      res.status(200);
      res.json({status: 'ok', message: 'заказ оформлен', orderId: response._id, qrCode});
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

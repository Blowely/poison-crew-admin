import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";
import {PRODUCT_STATUS} from "@/common/constants";
import axios from "axios";

export default async function handler(req,res) {
    const {method, query} = req;
    await mongooseConnect();

    if (method === 'POST') {
        try {
            const {clientId, orderId, status} = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

            const client = await Client.findOne({_id: clientId});
            const selectedOrder = await Order.findOne({_id: orderId});

            if (!client && clientId !== '6484636d37ff0fc06c41aa03') {
                res.status(404);
                return res.json({status: 'clientNotFoundOrDeleted', message: 'Клент не найден или удален'});
            }

            if (!selectedOrder) {
                res.status(404);
                return res.json({status: 'productNotFoundOrDeleted', message: 'Товар не найден или удален'});
            }


            const response = await Order.updateOne({_id: orderId}, {status})

            const deliveryCost = 1399 * (selectedOrder?.products?.length || 1)
            let totalPrice = 0;
            console.log('selectedOrder =',selectedOrder);
            if (status === PRODUCT_STATUS.PAYMENT_CHECK) {
                axios.post('https://api.re-poizon.ru/api/newBotMessage', {
                    text:`
                ---PAYMENT CHECK---\n
                id: ${orderId}\n
                ${selectedOrder?.products?.map(el => {
                        console.log('el =', el);
                        totalPrice += Math.ceil(Number(el?.price) * 13.3 + 1000);
                        return `${el?.title} (${el?.size}) - ${el?.price} CNY;\n
                    ${el?.src[0]}\n
                  `;
                    })} 
                totalPrice(RUB): ${totalPrice + deliveryCost}\n
                https://api.re-poizon.ru/orders\n`
                });
            }

            res.status(200);
            res.json({status: 'ok', message: 'статус успешно обновлен'});
        } catch (e) {
            console.log('e =', e);
            res.json({status: 'internalServerError', message: 'Ошибка сервера'});
            res.status(500);
        }
    }
}

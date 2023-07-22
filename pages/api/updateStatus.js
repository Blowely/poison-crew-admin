import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";

export default async function handler(req,res) {
    const {method, query} = req;
    await mongooseConnect();

    if (method === 'POST') {
        try {
            console.log('req.body',req.body);
            const {clientId, orderId, status} = req.body;

            const client = await Client.findOne({_id: clientId});
            const selectedOrder = await Order.find({_id: orderId});


            if (!client && clientId !== '6484636d37ff0fc06c41aa03') {
                res.json({status: 'clientNotFoundOrDeleted', message: 'Клент не найден или удален'});
                return res.status(404);
            }

            if (!selectedOrder) {
                res.json({status: 'productNotFoundOrDeleted', message: 'Товар не найден или удален'});
                return res.status(404);
            }


            const response = await Order.updateOne({_id: orderId}, {status})

            res.status(200);
            res.json({status: 'ok', message: 'статус успешно обновлен'});
        } catch (e) {
            console.log('e =', e);
            res.json({status: 'internalServerError', message: 'Ошибка сервера'});
            res.status(500);
        }
    }
}

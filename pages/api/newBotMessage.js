import {mongooseConnect} from "@/lib/mongoose";
import {Order} from "@/models/Order";
import {Client} from "@/models/Client";
import {Product} from "@/models/Product";
import axios from "axios";

export default async function handler(req,res) {
    const {method, query} = req;
    await mongooseConnect();

    const TELEGRAM_URI = `https://api.telegram.org/bot5815209672:AAGETufx2DfZxIdsm1q18GSn_bLpB-2-3Sg/sendMessage`


    if (method === 'POST') {
        try {
            const { message } = req.body;

            const messageText = message?.text?.toLowerCase()?.trim()
            const chatId = message?.chat?.id

            if (!messageText || !chatId) {
                return res.sendStatus(400)
            }

            await axios.post(TELEGRAM_URI, {
                chat_id: chatId,
                text: 'new-order'
            })
            res.send('Done')
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }
}

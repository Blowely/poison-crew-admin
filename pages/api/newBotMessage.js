import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";

export default async function handler(req,res) {
    const {method, query} = req;
    await mongooseConnect();

    const TELEGRAM_URI = `${process.env.TELEGRAM_URI}/sendMessage`

    if (method === 'POST') {
        try {
            const { message, text } = req.body;

            const messageText = message?.text;
            const chatId = message?.chat?.id

            if (!messageText || !chatId) {
                return res.sendStatus(400)
            }

            await axios.post(TELEGRAM_URI, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: text || 'chatId = ' + chatId
            })
            res.send('Done')
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }
}

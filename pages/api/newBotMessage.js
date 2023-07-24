import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";

export default async function handler(req,res) {
    const {method, query} = req;
    await mongooseConnect();

    const TELEGRAM_URI = `https://api.telegram.org/bot5815209672:AAGETufx2DfZxIdsm1q18GSn_bLpB-2-3Sg/sendMessage`

    if (method === 'POST') {
        try {
            console.log('req.body=',req.body);
            const { message, text } = req.body;

            const messageText = message?.text;
            const chatId = message?.chat?.id

            /*if (!messageText || !chatId) {
                return res.sendStatus(400)
            }*/

            await axios.post(TELEGRAM_URI, {
                chat_id: 664687823,
                text: text || 'lol'
            })
            res.send('Done')
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }
}

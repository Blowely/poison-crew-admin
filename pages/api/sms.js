import {Product} from "@/models/Product";
import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
var querystring         = require('querystring');
//import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";

const phonesCodesList = {}

export default async function handle(req, res) {
  const {method} = req;
  await mongooseConnect();

  if (method === 'GET') {
    const phone = req.query.phone;

    const code = Math.floor(1000 + Math.random() * 9000);
    phonesCodesList[phone] = {phone,  code};

    let uri = [
        `https://localhost:3002/api/sms`,
        '?text=', code,
        '&number=', phone,
        '&sign=', 're:poizon'
    ].join('');

    const test = `https://maryashin.2014@yandex.ru:5uRZB7O0UstynQgbBeWNnMsn3nbK@gate.smsaero.ru/v2/auth`;



    const response = await axios.get(test);
    console.log('response =',response);
    res.json(response);

  }

  if (method === 'POST') {
    const {phone, code} = req.body;
    if (phonesCodesList?.[phone].code !== code) {
      console.log('неверный код');
      res.json({err: 'неверный код'});
    }

    const clientDoc = await Product.create({phone})
    res.json(clientDoc);
  }
}
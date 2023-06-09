import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";

const phonesCodesList = {}

export default async function handle(req, res) {
  const {method} = req;
  await mongooseConnect();

  if (method === 'GET') {
    const phone = req.query.phone;

    const code = Math.floor(1000 + Math.random() * 9000);
    phonesCodesList[phone] = {phone,  code};

    const email = 'moviefokll@gmail.com'
    const apiKey = 'YHlsgo25Cs_zmFlRAyCuj8RMMauF8Za-'
    const uri = `https://gate.smsaero.ru/v2/sms/send`;

    let url = [
      `${uri}`,
      '?number=', phone,
      '&text=', code,
      '&sign=', 'SMS Aero'
    ].join('');

    await axios({
      method: 'GET',
      url: url,
      headers: {
        'Authorization': `Basic ${btoa(email + ':' + apiKey)}`,
      },
    });

    const token = btoa(`${phone}:${code}`);

    const isExist = await Client.findOne({phone: phone});

    if (isExist) {
      await Client.updateOne({phone}, {$set: {token}})
    } else {
      await Client.create({phone, token})
    }


    res.json({status: 'ok', message: 'код отправлен'});
    res.status(200);
  }

  if (method === 'POST') {
    const {phone, code} = JSON.parse(req.body);

    const result = await Client.findOne({phone: phone});
    const token = btoa(`${phone}:${code}`);

    if (result?.token !== token) {
      res.status(402);
      res.json({code: 'invalidCode', message: 'неверный код'});
      return;
    }

    res.json({token});
    res.status(200);
  }
}
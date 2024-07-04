import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";

const phonesCodesList = {}

export default async function handle(req, res) {
  const {method} = req;
  await mongooseConnect();

  if (method === 'GET') {
    try {
      const phone = req.query.phone;
      const userAgent = req.query?.userAgent;

      const code = Math.floor(1000 + Math.random() * 9000);
      phonesCodesList[phone] = {phone,  code};

      const email = 'moviefokll@gmail.com'
      const apiKey = '7uBLFcOzg6t0qK3MuDpNcycejSpi'
      const testUrl = `https://gate.smsaero.ru/v2/sms/send`;


      let url = [
        `${testUrl}`,
        '?number=', phone,
        '&text=', code,
        '&sign=', 'SMS Aero'
      ].join('');


      var headers = new Headers({
        'Authorization': `Basic ${btoa(email + ':' + apiKey)}`
      });

      await fetch(url, {headers: headers}).then(console.log).catch(console.log)

      const token = btoa(`${phone}:${code}`);

      const client = await Client.findOne({phone: phone});

      if (client || client?.userAgent === userAgent) {
        await Client.updateOne({phone}, {$set: {token, userAgent}})
      } else {
        await Client.create({phone, token})
      }

      res.json({status: 'ok', message: 'код отправлен'});
      res.status(200);
    } catch (e) {
      console.log('e= ', e);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
      res.status(500);
    }

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
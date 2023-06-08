import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import multiparty from "multiparty";
import {Product} from "@/models/Product";

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

    const response = await axios({
      method: 'GET',
      url: url,
      headers: {
        'Authorization': `Basic ${btoa(email + ':' + apiKey)}`,
      },
    });

    const token = btoa(`${phone}:${code}`);
    await Client.create({phone, token});

    res.json(response);
  }

  if (method === 'POST') {
    const {phone, code} = req.body;

    const result = await Client.findOne({phone: phone});
    const token = btoa(`${phone}:${code}`);

    if (result.token !== token) {
      console.log('неверный код');
      res.json({err: 'неверный код'});
      return;
    }

    res.json({token});
  }
}
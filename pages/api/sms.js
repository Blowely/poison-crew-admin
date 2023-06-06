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
    const reqPhone = req.query.phone;
    const code = Math.floor(1000 + Math.random() * 9000);
    phonesCodesList[reqPhone] = {phone: reqPhone,  code};
    var phone = reqPhone; // номер телефона
    var text = code; // текст
    var from = '';
    var apikey = '5uRZB7O0UstynQgbBeWNnMsn3nbK';
    /*var uri = [
      `https://maryashin.2014@yandex.ru:${apikey}@gate.smsaero.ru/v2/sms/send`,
      '?text=', querystring.escape( text ),
      '&number=', phone,
      '&sign=', 're:poizon',*/
    var uri = `https://maryashin.2014@yandex.ru:5uRZB7O0UstynQgbBeWNnMsn3nbK@gate.smsaero.ru/v2/auth`;


    axios.get(uri).then((result) => {

      var parsedData = JSON.parse(result);

      console.log('parsedData ='+parsedData);
      res.json(parsedData);

    }).catch(function(err) {
      console.log('ошибка сети '+err);
      res.json({err: err});
    });


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
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";

export default async function handle(req, res) {
  const {method, query} = req;
  const slug = query?.accounts;
  await mongooseConnect();


  if (method === 'GET') {
    const token = req.query.token;
    const decryptedToken = atob(token);
    const tokenData = decryptedToken.split(':');
    const phone = tokenData[0];

    const account = await Client.findOne({phone: phone});

    if (account) {
      res.json({account});
      res.status(200);
    } else {
      res.json({status: 'notFoundOrDeleted', message: 'Аккаунт не найден или удален'});
      res.status(404);
    }
  }

  if (method === 'POST') {
    try {
      const phone = req.query?.accPhone;
      const {address} = JSON.parse(req.body);

      const account = await Client.findOne({phone: phone});
      const result = await Client.updateOne({phone}, {$set: {addresses: [...account?.addresses, address]}})

      if (result) {
        res.json({status: 'ok', message: 'Адрес успешно добавлен'});
        res.status(200);
      } else {
        res.json({status: 'internalServerError', message: 'Ошибка сервера'});
        res.status(500);
      }
    } catch (e) {
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
      res.status(500);
    }

  }
}
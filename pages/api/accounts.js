import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";

export default async function handle(req, res) {
  const {method, query} = req;
  const methodType = query?.methodType;
  await mongooseConnect();


  if (method === 'GET') {
    const {phone} = decryptToken(query?.token);

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
      const {phone} = decryptToken(query?.token);
      //const type = query?.type;

      const {address, addressId} = JSON.parse(req.body);

      const account = await Client.findOne({phone: phone});

      if (methodType !== 'patchAccAddr') {
        const result = await Client.updateOne({phone}, {$set: {
          addresses: [...account?.addresses, address]},
        })

        const newClient = await Client.findOne({phone});

        if (result && newClient) {
          res.status(200);
          res.json({
            status: 'ok',
            message: 'Адрес успешно добавлен',
            addressId: newClient?.addresses[newClient?.addresses?.length - 1]?._id
          });
        } else {
          res.status(500);
          res.json({status: 'internalServerError', message: 'Ошибка сервера'});
        }
      }

      if (methodType === 'patchAccAddr') {
        const result = await Client.updateOne({phone}, {$set: {activeAddressId: addressId }})

        if (result) {
          res.json({status: 'ok', message: 'Активный адрес успешно изменен'});
          return res.status(200);
        } else {
          res.status(500);
          return res.json({status: 'internalServerError', message: 'Ошибка сервера'});
        }
      }
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера', text: e?.message});
    }
  }

  if (method === "DELETE") {
    try {
      const { phone } = decryptToken(query?.token);

      const result = await Client.findOneAndDelete({ phone });

      if (result) {
        return res.status(200).json({ status: "ok", message: "Аккаунт успешно удален" });
      } else {
        return res.status(404).json({ status: "notFound", message: "Аккаунт не найден" });
      }
    } catch (e) {
      return res.status(500).json({ status: "internalServerError", message: "Ошибка при удалении", text: e?.message });
    }
  }
}
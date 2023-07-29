import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";

export default async function handle(req, res) {
  const {method, query} = req;
  const methodType = query?.methodType;
  await mongooseConnect();



  if (method === 'POST') {
    try {
      const {phone} = decryptToken(query?.token);

      const {addressId} = JSON.parse(req.body);

      const account = await Client.findOne({phone: phone});

      console.log('addressId=',addressId);
      if (methodType === 'patchAccAddr') {
        const newAddresses = account?.addresses.map((adr) => {
          if (adr._id.toString() === addressId) {
            adr.isArchived = true;
          }
          return adr;
        });

        const findActive = newAddresses.findIndex((el) => el._id === account.activeAddressId);

        if (findActive < 0) {
          await Client.updateOne({phone}, {activeAddressId: ''})
        }

        const result = await Client.updateOne({phone}, {addresses: newAddresses})

        res.status(200);
        return res.json({status: 'ok', message: 'Адрес успешно удален', newAddresses: newAddresses});
      }

      res.status(405);
      return res.json({status: 'error', message: 'methodType !== patchAccAddr'});
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера', text: e?.message});
    }
  }
}
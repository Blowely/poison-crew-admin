import {mongooseConnect} from "@/lib/mongoose";
import {Promo} from "@/models/Promo";

export default async function handle(req, res) {
  await mongooseConnect() //remove if run local;
  const {method, query} = req;

  if (method === 'GET') {
    try {
      const code = query?.code?.toUpperCase() || '';
      const remoteCode = await Promo.findOne({value: code})

      if (remoteCode?.value) {
        return res.status(200).json({status: true});
      } else {
        return res.status(200).json({status: false});
      }
    } catch (e) {
      console.log('e =', e.message);
      return res.status(500).json({
        status: 'internalServerError',
        items: [],
        message: 'Ошибка сервера'
      });
    }
  }
}

import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";

const updateLastProductData = 'https://8baa-91-236-247-240.ngrok-free.app/api/updateLastProductData';
export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  //await isAdminRequest(req,res);
  if (method === 'POST') {
    try {
      const spuId = req.body.spuId;

      delete req.headers['accept-encoding'];
      delete req.headers['connection'];
      delete req.headers['content-length'];

      const auth = {
        path: 'https://app.dewu.com/api/v1/app/sx/commodity/detail/page/coupon/v5',
        query: req.query,
        body: req.body,
        headers: {...req.headers, host: 'app.dewu.com'}
      }

      const isExist = await ProductV3.findOne({spuId: spuId});

      if (isExist) {
        let productDoc = await ProductV3.findOneAndUpdate({
          spuId
        }, {auth})
        res.status(200);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }


      console.log('auth =',auth);
      let productDoc = await ProductV3.create({
        spuId, auth
      })
      res.status(200);
      res.json(productDoc);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: e});
    }
  }
}

import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";
import {ProductV4} from "@/models/ProductV4";
import {Log} from "@/models/Log";
import {ProductV5} from "@/models/ProductV5";

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  //await isAdminRequest(req,res);
  if (method === 'POST') {
    try {
      const skuId = req.body.skuId;
      const spuId = req.body.spuId;

      delete req.headers['accept-encoding'];
      delete req.headers['connection'];
      delete req.headers['content-length'];

      const auth = {
        path: 'https://asia-east-public.poizon.com/api/v1/app/adapter/oversea/seller/queryBiddingTradeTrendInfo',
        query: req.query,
        body: req.body,
        headers: {...req.headers, host: 'asia-east-public.poizon.com'}
      }

      const isExist = await ProductV5.findOne({skuId: skuId});

      await Log.create({skuId});

      if (isExist) {
        await ProductV5.findOneAndUpdate({
          skuId
        }, {auth})

        res.status(200);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }

      let productDoc = await ProductV5.create({
        spuId, skuId, auth
      })
      res.status(200);
      res.json(productDoc);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: e});
    }
  }
}

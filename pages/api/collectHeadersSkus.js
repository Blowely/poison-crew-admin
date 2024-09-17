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
import {Skus} from "@/models/Skus";

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

      const body = req.body;
      const data = req.body;
      const headers = {...req.headers, host: 'asia-east-public.poizon.com'};

      const auth = {
        path: 'https://asia-east-public.poizon.com/api/v1/app/adapter/oversea/seller/queryBiddingTradeTrendInfo',
        query: req.query,
        body,
        headers
      }

      const isExist = await Skus.findOne({skuId: skuId});

      const url = 'https://asia-east-public.poizon.com/api/v1/app/adapter/oversea/seller/queryBiddingTradeTrendInfo';

      console.log('url',url);
      console.log('data',data);
      console.log('headers',headers);

      const skuData = await axios.post(url,data,{headers}).catch((err) => {
        console.log('err',err)
      });
      console.log('skuData=',skuData);
      const detail = skuData?.data;

      await Log.create({skuId});

      if (isExist) {
        await Skus.findOneAndUpdate({
          skuId
        }, {auth, detail})

        res.status(200);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }

      let productDoc = await Skus.create({
        spuId, skuId, auth, detail
      })
      res.status(200);
      res.json(productDoc);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: e});
    }
  }
}

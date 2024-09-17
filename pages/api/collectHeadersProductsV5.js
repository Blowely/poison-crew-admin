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
      const spuId = req.body.spuId;

      delete req.headers['accept-encoding'];
      delete req.headers['connection'];
      delete req.headers['content-length'];

      const body = req.body;
      const headers = {...req.headers, host: 'asia-east-public.poizon.com'};

      const auth = {
        path: 'https://asia-east-public.poizon.com/api/v1/h5/adapter/center/oversea/get-index-spu-share-detail',
        query: req.query,
        body,
        headers
      }

      const isExist = await ProductV5.findOne({spuId});

      const productData = await axios({
        method: "POST",
        url: 'https://asia-east-public.poizon.com/api/v1/h5/adapter/center/oversea/get-index-spu-share-detail',
        body,
        headers,
      }).catch((err) => {
        console.log('err',err)
      })

      console.log('productData',productData)

      const detail = productData?.data;

      await Log.create({spuId});

      if (isExist) {
        await ProductV5.findOneAndUpdate({
          spuId
        }, {auth, detail})

        res.status(200);
        res.json({status: 'productIsExist', message: 'productIsExist'});
        return;
      }

      let productDoc = await ProductV5.create({
        spuId, auth, detail
      })
      res.status(200);
      res.json(productDoc);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: e});
    }
  }
}

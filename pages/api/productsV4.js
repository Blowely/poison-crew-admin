import {Product} from "@/models/Product";
import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";
import { setTimeout } from "timers/promises";
import {ProductV4} from "@/models/ProductV4";
import {customUrlBuilder, handlePoizonProductResponse, productsV4buildRequest} from "@/common/utils";

const myHeaders = new Headers();
myHeaders.append("accept", "*/*");
myHeaders.append("accept-language", "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5");
myHeaders.append("baggage", "sentry-environment=production,sentry-release=7qf8i2f2wgMdRdh7SOvSo,sentry-public_key=c81dfd5bfbf092f4ca212fd07c0862ed,sentry-trace_id=b622116fb21a47048d0431071e2878d2,sentry-sample_rate=1,sentry-sampled=true");
myHeaders.append("cache-control", "no-cache");
myHeaders.append("cookie", "_ga=GA1.1.151431174.1710783172; _ym_uid=1710783173642692711; _ym_d=1710783173; _userGUID=0:ltx84otz:7FkwrkzJ0dTXKwPVhz3zJ9fcB~kbop84; gender=men; _ga_KDREW63Q0N=deleted; _ym_isad=1; _ym_visorc=w; dSesn=4acf8eda-b210-7c86-4805-11647e67def5; _dvs=0:lz1c1avn:oLd9wVm6OIusUquyv5~8~C1D0tQJ4kj0; digi_uc=W1sidiIsIjYwMzg5MTIwOCIsMTcyMTkxNTUxMDEyNl0sWyJ2IiwiNjA1ODkwMDk5IiwxNzIxOTA5NDUzNzQ5XSxbInYiLCI2MDA4NDQyNDIiLDE3MjE4Mzg2NjMwNDddLFsidiIsIjYxMzI5NTIzMCIsMTcyMTgxNjkyODQ3NV0sWyJ2IiwiMzE0NzU0NTM3IiwxNzIxNjUzMDQ2ODIxXSxbInYiLCI2MzE0NzE2NDAiLDE3MjE2NDc0NTEzNjFdLFsidiIsIjYwMDg0NDIzNiIsMTcyMTY0NzAwMjYwMl0sWyJ2IiwiNjExMDA5Njc2JnV0bV9jYW1wYWlnbj1Vbmljb3JuX0VQS19SZXRhcmdldF8yJTdDMTEzMDg2OTg2JnV0bV9jb250ZW50PTU0NzM3Mzg5OTIlN0MxODQ4MzI1OTA2NTMyNzQ4MzQ4JnV0bV9tZWRpdW09Y3BjJnV0bV9zb3VyY2U9eWFuZGV4JnV0bV90ZXJtPSU3QzczNzAxNTY1JnljbGlkPTE3Njk1ODgwNzUyMDA5MDUyMTU5IiwxNzIxNjQ2NTk0NzA5XSxbInYiLCI2MTAyNjA2NDImdXRtX2NhbXBhaWduPVVuaWNvcm5fRVBLX1JldGFyZ2V0XzIlN0MxMTMwODY5ODYmdXRtX2NvbnRlbnQ9NTQ3MzczODk5MiU3QzE4NDgzMjU5MDY1MzI3NDgzNDgmdXRtX21lZGl1bT1jcGMmdXRtX3NvdXJjZT15YW5kZXgmdXRtX3Rlcm09JTdDNzM3MDE1NjUmeWNsaWQ9MTc2OTU4ODA3NTIwMDkwNTIxNTkiLDE3MjE1NzY4MTYzMTldLFsidiIsIjYxMDI2MDYzOSZ1dG1fc291cmNlPXlhbmRleCZ1dG1fbWVkaXVtPWNwYyZ1dG1fY2FtcGFpZ249VW5pY29ybl9FUEtfUmV0YXJnZXRfMnwxMTMwODY5ODYmdXRtX2NvbnRlbnQ9NTQ3MzczODk5MnwxODQ4MzI1OTA2NTMyNzQ4MzQ4JnV0bV90ZXJtPXw3MzcwMTU2NSZ5Y2xpZD0xNzY5NTg4MDc1MjAwOTA1MjE1OSIsMTcyMTU3NjgwMjYyM10sWyJ2IiwiNjAwMDEyNjYxIiwxNzIxOTE1NTU0MjEyXV0=; _ga_KDREW63Q0N=GS1.1.1721915510.102.1.1721915554.16.0.2085969482");
myHeaders.append("pragma", "no-cache");
myHeaders.append("priority", "u=1, i");
myHeaders.append("sec-ch-ua", "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"");
myHeaders.append("sec-ch-ua-mobile", "?0");
myHeaders.append("sec-ch-ua-platform", "\"Windows\"");
myHeaders.append("sec-fetch-dest", "empty");
myHeaders.append("sec-fetch-mode", "cors");
myHeaders.append("sec-fetch-site", "same-origin");
myHeaders.append("sentry-trace", "b622116fb21a47048d0431071e2878d2-b9b4aa63a8421172-1");
myHeaders.append("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

const updateLastProductData = 'http://localhost:3001/api/updateLastProductData';
const competitorUrl = 'https://unicorngo.ru/api/catalog/product';

const parseAuthProductDataBySpuId = async (spuId) => {
  const response = await fetch(`${competitorUrl}/${spuId}`, requestOptions)
    .catch((error) => console.error(error));

  if (!response.ok) {
    return false;
  }

  axios(`${updateLastProductData}?spuId=${spuId}`)
    .catch(() => console.log('updateProductFailed'));
  await setTimeout(1000)
  return true;
}

const updateProductBySpuId = async (spuId) => {
  try {
    const product = await ProductV4.findOne({spuId: spuId})
    if (!product) {
      return {error: false, product: {}, message: 'not found', status: 200};
    }

    if (!product?.auth) {
      return {error: false, product: {}, message: 'no auth data', status: 200};
    }

    const {path, query, body: authData, headers: authHeaders} = product.auth;

    const builtUrl = customUrlBuilder(path, query);
    console.log('builtUrl=',builtUrl)

    const {data: poizonProduct, statusText, status} = await axios.post(
      builtUrl,
      {...authData},
      {headers: authHeaders}
    )

    const handledPoizonProduct = handlePoizonProductResponse(poizonProduct)

    if (statusText !== 'OK' && status !== 200) {
      return {error: false, product: {}, message: 'poizon product not found', status: 200};
    }

    console.log(handledPoizonProduct)
    const updatedProduct = ProductV4.updateOne({spuId}, {...handledPoizonProduct})

    return {error: false, product: updatedProduct, message: 'updated', status: 200};
  } catch (e) {
    return {error: true, message: e.message, error_res: e, status: 501};
  }
}

export default async function handle(req, res) {
  await mongooseConnect();
  const {method, query} = req;
  if (method === 'GET') {
    try {
      const spuId = query?.spuId;
      const isParseAuth = query['parse-auth'];
      const isUpdate = query?.update;
      const category = query?.category;
      const search = query?.search;
      const offset = query?.offset || 0;
      const limit = query?.limit || 20;

      const reqObj = {
        category,
        search
      }

      if (spuId) {
        if (isParseAuth) {
          const response = await parseAuthProductDataBySpuId(spuId);

          if (!response) {
            return res.status(404).json({text:'miss product'});
          }

          return res.status(200).json({text:'request added to queue'});
        }

        if (isUpdate) {
          const {status, product, message, error_res} = await updateProductBySpuId(spuId);
          return res.status(status).json({product, message, error_res});
        }


        const productData = await ProductV4.findOne({spuId});
        return res.status(200).json(productData);
      }

      const items = await ProductV4.find(productsV4buildRequest({reqObj})).skip(offset).limit(limit);

      const totalCount = await ProductV4.count();

      const result = {items: items, total_count: totalCount }

      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'PUT') {
    try {
      const {
        title,
        description,
        price,
        src,
        images,
        category,
        properties,
        sizesAndPrices,
        cheapestPrice,
        sizeInfoList,
        _id,
        spuId,
        isDeleted
      } = req.body;

      const filter = !!_id ? {_id} : {spuId}
      const response = await ProductV4.updateOne({spuId}, {
        spuId,
        title,
        description,
        price,
        src,
        images,
        category,
        properties,
        sizesAndPrices,
        cheapestPrice,
        sizeInfoList,
        isDeleted
      },{upsert:true});

      res.status(200);
      res.json({answer: response.data});
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

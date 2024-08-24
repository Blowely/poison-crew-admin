import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {setTimeout} from "timers/promises";
import {ProductV4} from "@/models/ProductV4";
import {customUrlBuilder, handlePoizonProductResponse} from "@/common/utils";
import {Link} from "@/models/Link";
import {Brand} from "@/models/Brand";
import {Category} from "@/models/Category";
import * as cheerio from 'cheerio';

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

const createPoizonLink = async (spuId) => {
  const link = `dewulink://cdn-m.dewu.com/router/product/ProductDetail?spuId=${spuId}&sourceName=shareDetail&outside_channel_type=0&share_platform_title=7&fromUserId=d58f7d439f7c3698b497be3abca93169`;

  return await Link.create({
    link,
  });
}

const competitorCheckBySpuId = async (spuId) => {
  return await fetch(`${competitorUrl}/${spuId}`, requestOptions)
}

const parseAuthProductDataBySpuId = async (spuId, isCompetitorCheck) => {
  if (isCompetitorCheck) {
    const response = await competitorCheckBySpuId(spuId);

    if (!response.ok) {
      return false;
    }
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
      return {error: false, product: {}, message: 'not found', status: 404};
    }

    if (!product?.auth) {
      return {error: false, product: {}, message: 'no auth data', status: 200};
    }

    const {path, query, body: authData, headers: authHeaders} = product.auth;

    const builtUrl = customUrlBuilder(path, query);

    const {data: poizonProduct, statusText, status} = await axios.post(
      builtUrl,
      {...authData},
      {headers: authHeaders}
    )

    const handledPoizonProduct = handlePoizonProductResponse(poizonProduct)

    if (statusText !== 'OK' && status !== 200) {
      return {error: false, product: {}, message: 'poizon product not found', status: 200};
    }

    const isExistBrand = await Brand.findOne({id: handledPoizonProduct.brandId})

    if (!isExistBrand) {
      await Brand.create({
        id: Number(handledPoizonProduct.brandId),
        originName: handledPoizonProduct.brandName,
        logo: handledPoizonProduct.brandLogo
      });
    }

    const isExistCategory = await Category.findOne({id: handledPoizonProduct.categoryId})

    if (!isExistCategory) {
      await Category.create({
        id: Number(handledPoizonProduct.categoryId),
        originName: handledPoizonProduct.categoryName
      });
    }

    const updatedProduct = await ProductV4.updateOne({spuId}, handledPoizonProduct)

    return {error: false, product: updatedProduct, message: 'updated', status: 200};
  } catch (e) {
    return {error: true, message: e.message, status: 500};
  }
}

export default async function handle(req, res) {
  await mongooseConnect() //remove if run local;
  const {method, query} = req;

  if (method === 'GET') {
    try {
      const isAdmin = query['admin'] || false;
      const spuId = query?.spuId;
      const isParseAuth = query['parse-auth'];
      const isCompetitorCheck = query['competitor-check'] || false;
      const existLinkNumber = query['exist-link'];
      const existProductNumber = query['exist-product'];
      const isUpdate = query?.update;
      const search = query?.search;
      const brandId = query?.brandId || null;
      const brandIds = query?.brandIds || null;
      const categoryId = query?.categoryId || null;
      const level1CategoryId = query?.level1CategoryId || null;
      const level2CategoryId = query?.level2CategoryId || null;
      const offset = query?.offset || 0;
      const limit = query?.limit || "20";
      const minPrice = query?.minPrice;
      const maxPrice = query?.maxPrice;
      const sizeType = query?.sizeType;
      const size = query?.size;
      const sortDirection = query?.sortDirection;
      const page = query?.page || '1';
      const url = query?.url;

      const reqObj = {
        search,
        sizeType,
        size,
        minPrice,
        maxPrice,
      }

      if (existLinkNumber) {
        const linkProducts = await Link.find({}).skip(existLinkNumber).limit(1)

        if (!linkProducts?.[0]) {
          return res.status(404).json({text: 'not found'});
        }
        await setTimeout(1000);
        return res.status(200).json(linkProducts[0]);
      }

      if (existProductNumber && isUpdate) {
        const products = await ProductV4.find({}).skip(existProductNumber).limit(1)

        if (!products?.[0]) {
          return res.status(404).json({text: 'not found'});
        }

        const {status, product, message} = await updateProductBySpuId(products[0].spuId);
        console.log('product',product)

        return res.status(status).json({product, message});
      }

      if (url) {
        let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://www.poizon.com/product/${url}`,
        };

        const response = await axios.request(config);

        const $ = cheerio.load(`${response.data}`);
        const rawData = $('script[id="__NEXT_DATA__"]:first').text();

        let productData = [];
        try {
          const data = JSON.parse(rawData);
          productData = data?.props?.pageProps;
          console.log('data?.props?.pageProps =',data?.props?.pageProps) //check priceInfo
        } catch (error) {
          console.error("Ошибка парсинга JSON:", error);
        }

        return res.status(200).json(productData);
      }

      if (spuId) {
        if (isParseAuth) {
          const response = await parseAuthProductDataBySpuId(spuId, isCompetitorCheck);

          if (!response) {
            return res.status(404).json({text:'not found'});
          }

          return res.status(200).json({text:'request added to queue'});
        }

        if (isUpdate) {
          const {status, product, message} = await updateProductBySpuId(spuId);
          return res.status(status).json({product, message});
        }

        if (isCompetitorCheck) {
          const response = await competitorCheckBySpuId(spuId);

          if (!response.ok) {
            return res.status(404).json({text:'not found'});
          }

          const productDoc = await createPoizonLink(spuId);

          return res.status(200).json(productDoc);
        }

        const productData = await ProductV4.findOne({spuId});
        return res.status(200).json(productData);
      }

      const productsV4buildRequest = () => {
        const {search, minPrice, maxPrice, sizeType, size} = reqObj;

        let obj = {};

        if (search) {
          obj.clearTitle = new RegExp(search, "i");
        }

        if (brandId) {
          obj.brandId = Number(brandId);
        }

        if (brandIds) {
          obj.brandId = { $in: brandIds.split(',').map((el) => Number(el)) }
        }

        if (categoryId) {
          obj.categoryId = Number(categoryId);
        }

        if (level1CategoryId) {
          obj.level1CategoryId = Number(level1CategoryId);
        }

        if (level2CategoryId) {
          obj.level2CategoryId = Number(level2CategoryId);
        }

        if (sizeType) {
          obj.sizeType = new RegExp('.*' + sizeType + '.*');
        }

        if (size) {
          // Формируем запрос для фильтрации по размеру
          obj.sizesAndPrices = {
            $elemMatch: {
              size: size,
              ...(minPrice !== undefined && { price: { $gte: parseFloat(minPrice)  } }),
              ...(maxPrice !== undefined && { price: { $lte: parseFloat(maxPrice)  } })
            }
          }
        } else {
          // Формируем запрос для фильтрации по полю cheapestPrice
          obj = {
            ...obj,
            ...(minPrice !== undefined &&  { cheapestPrice: { $gte: parseFloat(minPrice) } }),
            ...(maxPrice !== undefined && { cheapestPrice: { $lte: parseFloat(maxPrice) } })
          };
        }

        // if (queryType !== 'admin') {
        //   obj.price = {$gt: 1}
        // }

        return obj;
      }

      const projection = {
        ...(isAdmin === false && { auth: 0 })
      };

      const sortOrder = sortDirection === 'asc' ? 1 : sortDirection === 'desc' ? -1 : null;

      /*const items = await ProductV4.find(productsV4buildRequest(), projection)
        .skip(offset)
        .limit(limit);*/
      //console.log('items',items);

      /*const items = await ProductV4.aggregate([
        { $match: productsV4buildRequest() },
        ...(minPrice === undefined ? [
          {
            $addFields: {
              hasPrice: { $cond: { if: { $ne: ["$cheapestPrice", null] }, then: 1, else: 0 } }
            }
          },
          {
            $sort: sortOrder ? { hasPrice: -1, cheapestPrice: sortOrder } : { hasPrice: -1, _id: 1 }
          }
        ] : [
          { $sort: sortOrder ? { cheapestPrice: sortOrder } : { _id: 1 } }
        ]),
        { $skip: Number(offset) },
        { $limit: Number(limit) },
        { $project: projection }
      ]);*/
      //let filteredCount = await ProductV4.countDocuments(productsV4buildRequest());

      //const totalCount = await ProductV4.count();

      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://www.poizon.com/category/sneakers-500000091?pinSpuIds=64839289&page=${page}`,
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5',
          'cache-control': 'no-cache',
          'cookie': 'fe_sensors_ssid=72bbe4e5-cb7f-405e-8fee-97c21c20b089; _gcl_au=1.1.1389199027.1724270793; _scid=384e81a0-cbf6-4e26-9c69-78ce3b82baac; _pin_unauth=dWlkPU1UVTJOamRrTURjdFlXVm1aaTAwWVRrd0xUZ3hOMkV0WlRnek4yRmhPV1ZtWTJJeg; _ga=GA1.1.1513070028.1724270794; _ScCbts=%5B%5D; sk=9OwIO03sERS71jLjFNmrHy5ynKAIVi1gDKN6lK5sWxd6HmhJsOiPMOD4ecqRctHDrI0vHiTJF8CVtqiI885eKvUIpf1t; _sctr=1%7C1724187600000; _fbp=fb.1.1724271221984.242998406874190143; duToken=Mst6G15wXz1J79oOclDjq00je4xvI0R9rgJOfkAY_SmOk6yunK93KcGuQcE8zloY3jncqlDeVbArJVmVmAp7iiHgzqXqjkaqlgLINXNkmWZreOYEDSrbahSd+jBKUldWVniPnWmK1hUZWqlKn9BnfHueoymqkJzUM6ScDNWiagEu+3_8QTGWHOUdFB6+12YcBUqDKS98QGxl3tTcy41XKWpLu3F6Jq+ZB+f+iw3snVfvFVndh_KrHbKNiGXtw6QISwo0_tKS4kGN0HSY02MuaZUy4hiLxpxpjfj7j_y1swTdvWhhEwBGLL5w8H5RP7PrAcuT7H7ZACa0qB5fLr4dF35Ki2t0dcw5q_JxbBgFtAvOKmNum4YHsGW2RK8WHySzjH8phDWgBY18rLjL; feLoginExpire=1724882664000; feLoginss=2060878319; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22191768c51e41ba8-0209215c5b4d9ba-26001e51-2073600-191768c51e5d02%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTkxNzY4YzUxZTQxYmE4LTAyMDkyMTVjNWI0ZDliYS0yNjAwMWU1MS0yMDczNjAwLTE5MTc2OGM1MWU1ZDAyIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%2C%22%24device_id%22%3A%22191768c51e41ba8-0209215c5b4d9ba-26001e51-2073600-191768c51e5d02%22%7D; _clck=29nabb%7C2%7Cfol%7C0%7C1694; _clsk=3f5kah%7C1724506847049%7C3%7C1%7Cs.clarity.ms%2Fcollect; accessToken=iC18xoiHQobXmByh7YYae2MJnVkEyay71XeXO4bwsgAg5AFHL8YvZxVCZQY5VDQm; tfstk=fcIjM4ZtBjcXUtBWsEeyP5oB74K1csZUfA9OKOnqBnKA1OCFaFdw0ZzO1_OP0IW2DCn1K9KNuZXZnafFpmS4oho6mhxTTWrUYtWDjhESOjJKiup2LloxXIUN0FJbTWrU4BdL5tFF7a2oVU9MwKpxkheW2d9wXjpA6QLJpplvXhCOe89wQVhvHKHJ2dJZCcMBCrOch8IK14cERJByNcnIZnLY1s0Z-2qXnEdptEm9hg9XlBBAmnGWlLIPVe8rQ7tRKa5vFHZjtK_Rdnp1jJ361FsDVd_uGq5CidBJPsyZSL_1BMxDAAEAFnOXJgL0fJfdFOQePgyLxntvMN-cQvNVFi1Vng6ZB4KX0aTCcHEnMC7PdG91j5q5OOBhWUssGgyKYBOQbVMW-c9WT8wSSVJMSlcSAOblQEpkhUy7FjQMkLvWT8wSSVYvEKOzF8GAS; __kla_id=eyJjaWQiOiJObVE0WWpFMU1HVXROemcwTUMwME56YzJMVGsxTTJRdE1UTmlNVFptTmpNMlpEQmgiLCIkcmVmZXJyZXIiOnsidHMiOjE3MjQyNzA3OTMsInZhbHVlIjoiaHR0cHM6Ly93d3cucG9pem9uLmNvbS8iLCJmaXJzdF9wYWdlIjoiaHR0cHM6Ly93d3cucG9pem9uLmNvbS9wcm9kdWN0L2pvcmRhbi0xLWxvdy1hc2hlbi1zbGF0ZS1tZW4tcy01MzU0MDg4MT90cmFja19yZWZlcmVyX3BhZ2VfaWQ9MjI5NiZ0cmFja19yZWZlcmVyX2Jsb2NrX3R5cGU9NDc2NiZ0cmFja19yZWZlcmVyX3Bvc2l0aW9uPTIifSwiJGxhc3RfcmVmZXJyZXIiOnsidHMiOjE3MjQ1Mjg0MzksInZhbHVlIjoiIiwiZmlyc3RfcGFnZSI6Imh0dHBzOi8vd3d3LnBvaXpvbi5jb20vIn19; _uetsid=c54b2ed0621d11ef9a914b7247eece9a; _uetvid=dd0b00405ff811efb177f75985c57097; _scid_r=384e81a0-cbf6-4e26-9c69-78ce3b82baac; _ga_PPLYZ7Q5C8=GS1.1.1724528462.9.0.1724528462.60.0.0; fe_sensors_ssid=72bbe4e5-cb7f-405e-8fee-97c21c20b089',
          'pragma': 'no-cache',
          'priority': 'u=0, i',
          'referer': 'https://www.poizon.com/',
          'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
        }
      };

      const response = await axios.request(config);

      const $ = cheerio.load(`${response.data}`);
      const rawData = $('script[type="application/ld+json"]:first').text();
      let items = [];
      try {
        const data = JSON.parse(rawData);
        items = data?.itemListElement;
      } catch (error) {
        console.error("Ошибка парсинга JSON:", error);
      }

      const result = {items: items }

      res.status(200).json(result);
    } catch (e) {
      console.log('e =', e.message);
      res.status(500).json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'POST') {
    try {
      const {
        spuId,
        auth
      } = req.body;

      let productDoc = await ProductV4.create({
        spuId, auth
      })

      res.status(200).json(productDoc);
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
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

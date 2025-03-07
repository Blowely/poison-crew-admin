import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {setTimeout} from "timers/promises";
import {ProductV4} from "@/models/ProductV4";
import {customUrlBuilder, handlePoizonProductResponse} from "@/common/utils";
import {Link} from "@/models/Link";
import {Brand} from "@/models/Brand";
import {Category} from "@/models/Category";
import * as cheerio from 'cheerio';
import {ProductV5} from "@/models/ProductV5";
import {Skus} from "@/models/Skus";

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
  //const link = `dewulink://cdn-m.dewu.com/router/product/ProductDetail?spuId=${spuId}&sourceName=shareDetail&outside_channel_type=0&share_platform_title=7&fromUserId=d58f7d439f7c3698b497be3abca93169`;
  const link = `https://poizon2hk.page.link/?link=https://hk.poizon.com/router/sell/productDetail?spuId=${spuId}&ibi=com.shizhuang.poizon.hk&isi=1509915974&efr=1`;

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

const getPrice = async (skuId) => {
  try {
    const response = await fetch(`https://api.re-poizon.ru/api/productsV5?skuId=${skuId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch price:", error);
    throw error;
  }
};

async function fetchSkuPrices(skus) {
  const prices = await Promise.all(
      skus?.map(async (sku) => {
        try {
          // Псевдозапрос к бэку для получения цены
          const response = await getPrice(sku.skuId);

          if (!response?.spuId) throw new Error(`Error fetching price for skuId ${sku.skuId}`);
          const {detail} = response;
          console.log('response',response);
          return { ...sku, price: detail.data.verticals[detail.data.verticals.length - 1] };
        } catch (error) {
          console.error(error);
          return { ...sku, price: null }; // Если произошла ошибка, цена будет null
        }
      })
  );
  return prices;
}

const updateProductPricesBySpuId = async (spuId) => {
  try {
    const product = await ProductV5.findOne({spuId: spuId});

    if (!product) {
      return {error: false, product: {}, message: 'not found', status: 404};
    }

    const data = product.detail.data || {};
    const sizeMap = {};

    data.saleProperties?.list?.forEach((property) => {
      if (property.name === "尺碼" && property.propertyValueId) {
        sizeMap[property.propertyValueId] = property.value;
      }
    });

    const mappedSkus = data.skus?.map((sku) => {
      const sizeProperty = sku.properties?.find(
          (prop) => sizeMap[prop.propertyValueId]
      );

      return {
        skuId: sku.skuId,
        spuId: sku.spuId,
        propertyValueId: sizeProperty?.propertyValueId || null,
        size: sizeProperty ? sizeMap[sizeProperty.propertyValueId] : null
      };
    }) || [];

    const prices = await fetchSkuPrices(mappedSkus);

    const options = {
      method: 'PUT',
      body: JSON.stringify({spuId: product.spuId, sizesAndPrices: prices || []}),
    }

    const response = await fetch(`https://api.re-poizon.ru/api/productsV5`, options);
    const updatedProduct = await ProductV5.findOne({spuId: product.spuId});

    return {error: false, product: updatedProduct, message: response.statusText, status: response.status};
  } catch (e) {
    console.log('e =', e?.message)
  }
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

const updateSkuBySkuId = async (skuId) => {
  try {
    const skuData = await Skus.findOne({skuId: skuId});

    if (!skuData) {
      return {error: false, skuData: {}, message: 'not found', status: 404};
    }

    if (!skuData?.auth) {
      return {error: false, skuData: {}, message: 'no auth data', status: 200};
    }

    const {path, query, body: authData, headers: authHeaders} = skuData.auth;

    const builtUrl = customUrlBuilder(path, query);

    const {data: skuPropertyData, statusText, status} = await axios.post(
        builtUrl,
        {...authData},
        {headers: authHeaders}
    )

    if (statusText !== 'OK' && status !== 200) {
      return {error: false, skuData: {}, message: 'skuPropertyData not found', status: 200};
    }

    const updatedSku = await Skus.findOneAndUpdate({skuId}, {detail: skuPropertyData.data})

    return {error: false, skuData: updatedSku, message: 'updated', status: 200};
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
      const skuId = query?.skuId;
      const isParseAuth = query['parse-auth'];
      const isCompetitorCheck = query['competitor-check'] || false;
      const existLinkNumber = query['exist-link'];
      const existProductNumber = query['exist-product'];
      const isUpdate = query?.update;
      const isUpdatePrices = query?.updatePrices;
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

        if (isUpdatePrices) {
          const {status, product, message} = await updateProductPricesBySpuId(spuId);
          return res.status(status).json({status, product, message});
        }

        if (isCompetitorCheck) {
          const response = await competitorCheckBySpuId(spuId);

          if (!response.ok) {
            return res.status(404).json({text:'not found'});
          }

          const productDoc = await createPoizonLink(spuId);

          return res.status(200).json(productDoc);
        }

        const productData = await ProductV5.findOne({spuId});
        return res.status(200).json(productData);
      }

      if (skuId) {
        if (isUpdate) {
          const {status, skuData, message} = await updateSkuBySkuId(skuId);
          return res.status(status).json({skuData, message});
        }
        console.log('skuId=',skuId)
        const skuData = await Skus.findOne({skuId: skuId});
        return res.status(200).json(skuData);
      }

      const productsV5buildRequest = () => {
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

      const items = await ProductV5.find(productsV5buildRequest())
        .skip(offset)
        .limit(limit)
      //console.log('items',items);


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
        spuId,
        sizesAndPrices,
      } = JSON.parse(req.body);

      const response = await ProductV5.updateOne({spuId}, {
        $set: {
          "detail.data.sizesAndPrices": sizesAndPrices,
        },
      });

      res.status(200);
      res.json({answer: response.data});
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {Link} from "@/models/Link";
import {setTimeout} from "timers/promises";
import {ProductV6} from "@/models/ProductV6";
import {Skus} from "@/models/Skus";
import {APPAREL_SIZES, APPAREL_SIZES_MATCHES, COLOR_LIST} from "@/common/constants";

async function fetchAndStoreProducts(req, res) {
  try {
    for (let page = 1; page <= 26; page++) {
      console.log(page);
      const res = await fetch(`https://unicorngo.ru/api/catalog/product?sort=cheap-first&search=Air%20Force&brands=Nike&categorySlug=footwear&page=${page}&perPage=40`, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5",
          "baggage": "sentry-environment=vercel-production,sentry-release=2969582cd32145f70ac41c590da967a96e52b600,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=6aed8baf9c43414fbc16054954267e1c,sentry-sample_rate=1,sentry-sampled=true",
          "priority": "u=1, i",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sentry-trace": "6aed8baf9c43414fbc16054954267e1c-b6032d54b2139675-1"
        },
        "referrer": "https://unicorngo.ru/footwear?brands=Nike&page=1&perPage=40&search=Air%20Force&sort=cheap-first",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });

      const response = await res.json();

      const items = response.items || [];

      for (const item of items) {
        await ProductV6.updateOne(
            { spuId: item.spuId },
            { $set: item },
            { upsert: true }
        );
      }
    }

    /*for (let page = 1; page <= 26; page++) {
      console.log(page);
      const response = await axios.get(baseUrl, {
        accessoriesMenHeaders,
        params: {
          //brands: 'Lee',
          //search: '定制球鞋',
          //sizeType: 'EU',
          sort: 'by-relevance',
          fit: ['MALE', 'UNISEX'], // Массив для нескольких значений
          //categorySlug: 'apparel/featured_tops/t_shirt',
          categorySlug: 'accessories',
          //categorySlug: 'apparel',
          page,
          perPage: 40,
        }
      });

      const items = response.data.items || [];

      for (const item of items) {
        await ProductV6.updateOne(
          { spuId: item.spuId },
          { $set: item },
          { upsert: true }
        );
      }
    }*/

    res.status(200).json({ message: 'Products fetched and stored successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products.', error: error.message });
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
      const categoryId = query?.category1Id || null;
      const category2Id = query?.category2Id || null;
      const category3Id = query?.category3Id || null;
      const level1CategoryId = query?.level1CategoryId || null;
      const level2CategoryId = query?.level2CategoryId || null;
      const offset = query?.page > 1 ? query?.page * query?.limit - 20 : 0;
      const limit = query?.limit || "20";
      const minPrice = query?.minPrice;
      const maxPrice = query?.maxPrice;
      const sizeType = query?.sizeType;
      const sizes = query?.sizes;
      const sortDirection = query?.sort;
      const fit = query?.fit;
      const page = query?.page || '1';
      const url = query?.url;
      const colors = query?.colors;


      const reqObj = {
        search,
        sizeType,
        sizes,
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
        const products = await ProductV6.find({}).skip(existProductNumber).limit(1)

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

        const productData = await ProductV6.findOne({spuId});
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

      const productsV6buildRequest = () => {
        const {search, minPrice, maxPrice, sizeType, sizes} = reqObj;

        let obj = {};

        if (brandId) {
          obj.brandId = Number(brandId);
        }

        if (brandIds) {
          obj.brandId = { $in: brandIds.split(',').map((el) => Number(el)) }
        }

        if (category3Id) {
          obj.category3 = Number(category3Id);
        }

        if (category2Id) {
          obj.category2 = Number(category2Id);
        }

        if (categoryId) {
          obj.category1 = Number(categoryId);
        }

        const getPrice = () => {
          let obj =  { $gt: 0 };

          if (minPrice) {
            obj = { $gte: Number(minPrice)};
          }

          if (maxPrice) {
            obj = {...obj, $lte: Number(maxPrice)};
          }

          return obj;
        }

        if (sizes) {
          const sizesArr = sizes.split(',');

          if (APPAREL_SIZES.includes(sizesArr[0])) {
            obj['properties.propertyValues'] = {
              $elemMatch: {
                value: { $in: [...sizesArr, ...sizesArr.map((el) => APPAREL_SIZES_MATCHES[el] || null)].filter(el => el) },
              },
            };
          } else {
            obj.skus = {
              $elemMatch: { 'size.eu': { $in: sizesArr }, price: getPrice() },
            };
          }
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

        if (minPrice && !sizes) {
          obj.price = { $gte: Number(minPrice)};
        }

        if (maxPrice && !sizes) {
          obj.price = { $lte: Number(maxPrice)};
        }

        if (fit) {
          obj.fit = { $in: [fit, "UNISEX"] };
        }

        if (colors) {
          const getColors = () => {
            return colors.split(',').map((el) => {
              const hexIndex = COLOR_LIST.findIndex(c => c.hex === el);
              return COLOR_LIST[hexIndex].name.toLowerCase();
            })
          }

          obj.productProperties = {
            $elemMatch: {
              definitionId: "PRIMARY_COLOR",
                  translatedValue: { $in: getColors() }
            }
          }
        }

        // if (queryType !== 'admin') {
        //   obj.price = {$gt: 1}
        // }

        return obj;
      }

      const projection = {
        ...(isAdmin === false && { auth: 0 })
      };

      const sortOrder =
          sortDirection === "cheap-first" ? 1 :
              sortDirection === "expensive-first" ? -1 :
                  null;

      let items = [];

// Если нет поискового запроса и других фильтров, делаем случайную выборку
      if (
          !search &&
          sortOrder === null &&
          !spuId &&
          !category2Id &&
          !category3Id &&
          !sizes &&
          !minPrice &&
          !maxPrice &&
          !colors &&
          !brandId &&
          !brandIds
      ) {
        items = await ProductV6.aggregate([
          {
            $match: {
              ...productsV6buildRequest(),
              price: { $gt: 0 }
            }
          },
          {
            $sample: {
              size: Number(limit)
            }
          }
        ]);
      } else if (search) {
        // Используем MongoDB Atlas Search
        // Собираем конвейер для aggregate
        const pipeline = [];

        pipeline.push({
          "$search": {
            "index": "default2",
            "compound": {
              "should": [
                {
                  "text": {
                    "query": search,
                    "path": "category.category3",
                    "synonyms": "ru_en_synonyms",
                    "score": { "boost": { "value": 5 } }
                  }
                },
                {
                  "text": {
                    "query": search,
                    "path": "category.category2",
                    "synonyms": "ru_en_synonyms",
                    "score": { "boost": { "value": 4 } }
                  }
                },
                {
                  "text": {
                    "query": search,
                    "path": "category.category1",
                    "synonyms": "ru_en_synonyms",
                    "score": { "boost": { "value": 3 } }
                  }
                },
                {
                  "text": {
                    "query": search,
                    "path": "name",
                    "synonyms": "ru_en_synonyms",
                    "score": { "boost": { "value": 2 } }
                  }
                },
                {
                  "text": {
                    "query": search,
                    "path": "brand",
                    "synonyms": "ru_en_synonyms",
                    "score": { "boost": { "value": 1 } }
                  }
                }
              ]
            }
          }
        });


        // 2) Накладываем остальные фильтры
        const matchObj = productsV6buildRequest();
        // Если в matchObj осталось поле name с RegExp (для обычного поиска), удалим его,
        // чтобы не мешать Atlas Search.
        if (matchObj.name) {
          delete matchObj.name;
        }

        // Применяем match только если там реально есть что матчить (кроме name).
        if (Object.keys(matchObj).length > 0) {
          pipeline.push({ $match: matchObj });
        }

        // 3) Сортировка, если есть sortOrder
        if (sortOrder !== null) {
          pipeline.push({ $sort: { price: sortOrder } });
        }

        // 4) Прочие шаги
        if (offset) {
          pipeline.push({ $skip: offset });
        }
        if (limit) {
          pipeline.push({ $limit: Number(limit) });
        }

        items = await ProductV6.aggregate(pipeline);
      } else {
        // Если search нет, но есть другие фильтры или сортировка
        items = await ProductV6.find(productsV6buildRequest())
            .sort(sortOrder !== null ? { price: sortOrder } : {})
            .skip(offset)
            .limit(limit);
      }

      const result = { items };

      res.status(200).json(result);
    } catch (e) {
      console.log('e =', e.message);
      res.status(500).json({status: 'internalServerError', items: [], message: 'Ошибка сервера'});
    }
  }

  async function updateProducts(req, res) {
    const baseUrl = 'https://unicorngo.ru/api/catalog/product';
    const headers = {
      'Accept': '*/*',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Cookie': '_ga=GA1.1.151431174.1710783172; _ym_uid=1710783173642692711; _userGUID=0:ltx84otz:7FkwrkzJ0dTXKwPVhz3zJ9fcB~kbop84;',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
    };

    try {
      const products = await ProductV6.find({ 'skus': { $size: 0 } }, 'spuId');
      console.log(products.length);
      let i = 0;

      for (const product of products) {
        i++
        console.log(i);
        const response = await axios.get(`${baseUrl}/${product.spuId}`, { headers });
        const updatedData = response.data;

        await ProductV6.updateOne(
          { spuId: product.spuId },
          { $set: updatedData }
        );
      }

      res.status(200).json({ message: 'Products updated successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating products.', error: error.message });
    }
  }

  if (method === 'POST') {
    try {
      return await fetchAndStoreProducts(req, res);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'PATCH') {
    return await updateProducts(req, res)
  }
}

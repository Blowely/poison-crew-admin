import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {Link} from "@/models/Link";
import {setTimeout} from "timers/promises";
import {ProductV6} from "@/models/ProductV6";
import {Skus} from "@/models/Skus";
import {APPAREL_SIZES, APPAREL_SIZES_MATCHES, COLOR_LIST} from "@/common/constants";

async function fetchAndStoreProducts(req, res) {
  const baseUrl = 'https://unicorngo.ru/api/catalog/product';
  const menHeaders = {
    'Accept': '*/*',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Cookie': '_ga=GA1.1.151431174.1710783172; _ym_uid=1710783173642692711; _userGUID=0:ltx84otz:7FkwrkzJ0dTXKwPVhz3zJ9fcB~kbop84;',
    'Pragma': 'no-cache',
    'Referer': 'https://unicorngo.ru/men/footwear/sneakers?gender=man&sizeType=EU&sizeValue=44.5&sort=by-relevance',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
  };

  const womenHeaders = {
    'Accept': '*/*',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5',
    'Connection': 'keep-alive',
    'Cookie': '_ym_uid=1733236184663775395; _ym_d=1733236184; _ga=GA1.1.1011185662.1733236185; _ym_isad=1; _ym_visorc=w; gender=women; _ga_KDREW63Q0N=GS1.1.1737318975.7.1.1737320285.51.0.836369742; ph_phc_hDXjOarYgxpEWNaBeHLnG9xnOcDoOq3ghdXldbJsX81_posthog=%7B%22distinct_id%22%3A%2201938ced-538d-78b9-887a-2567e48f6f06%22%2C%22%24sesid%22%3A%5B1737320527949%2C%2201948047-c5cf-743e-868a-d8c1fd95d013%22%2C1737318974927%5D%7D; _dd_s=rum=2&id=ec563305-b507-4fe1-bd5c-eec321549792&created=1737318974389&expire=1737321440108',
    'Referer': 'https://unicorngo.ru/women/footwear/sneakers',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'baggage': 'sentry-environment=production,sentry-release=mUJbfSHAo6vLL7nTWP_CS,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=88f2e43d8849473eb4b03c09d44c7b63,sentry-sample_rate=1,sentry-sampled=true',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sentry-trace': '128204acae9e49e797e29a3f8e0fd798-9a7eb728df64365a-1',
  };

  const tShirtHeaders = {
    'sentry-trace': '83e0601822834b03af163e4f8998590f-a24b1512f8425873-1',
    'Referer': 'https://unicorngo.ru/women/apparel/t_shirt',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'baggage': 'sentry-environment=production,sentry-release=mUJbfSHAo6vLL7nTWP_CS,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=83e0601822834b03af163e4f8998590f,sentry-sample_rate=1,sentry-sampled=true',
  };

  const glassesHeaders = {
    'sentry-trace': '71e93119bde0402a9a2cdf9f5a4446f0-b345d0d4b1e7cd98-1',
    'sec-ch-ua-platform': '"macOS"',
    'Referer': 'https://unicorngo.ru/women/accessories/glasses',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'baggage': 'sentry-environment=production,sentry-release=mUJbfSHAo6vLL7nTWP_CS,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=71e93119bde0402a9a2cdf9f5a4446f0,sentry-sample_rate=1,sentry-sampled=true',
  };

  const bagsHeaders = {
    'sentry-trace': '914fda47e8e041788790fd624a5d0b40-94036b279dff5e2e-1',
    'sec-ch-ua-platform': '"macOS"',
    'Referer': 'https://unicorngo.ru/women/accessories/bags',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'baggage': 'sentry-environment=production,sentry-release=mUJbfSHAo6vLL7nTWP_CS,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=914fda47e8e041788790fd624a5d0b40,sentry-sample_rate=1,sentry-sampled=true',
  };

  const appearelMenHeaders = {
       'Accept': '*/*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5',
        'Connection': 'keep-alive',
        'Cookie': '_ym_uid=1733236184663775395; _ym_d=1733236184; _ga=GA1.1.1011185662.1733236185; gender=men; _ym_isad=1; _ym_visorc=w; _ga_KDREW63Q0N=GS1.1.1737893964.27.0.1737894061.60.0.929029935; ph_phc_hDXjOarYgxpEWNaBeHLnG9xnOcDoOq3ghdXldbJsX81_posthog=%7B%22distinct_id%22%3A%2201938ced-538d-78b9-887a-2567e48f6f06%22%2C%22%24sesid%22%3A%5B1737894280708%2C%220194a28d-1087-7e7f-9971-8a942e9b3665%22%2C1737893941383%5D%7D; _dd_s=rum=2&id=188d57ac-baa5-4566-bd70-2ddd774221d1&created=1737893941308&expire=1737895180702',
        'If-None-Match': 'W/"afec-8JDeFanGeq1DcYVCc7A62rcif18"',
        'Referer': 'https://unicorngo.ru/men/apparel',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'baggage': 'sentry-environment=production,sentry-release=OVN5nci_e59dfYK60RAEn,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=ea0505b7e8d94649acf8ab07c2e0943e,sentry-sample_rate=1,sentry-sampled=true',
        'sentry-trace': 'ea0505b7e8d94649acf8ab07c2e0943e-ab1f71a57b21e8de-1',
  }

  const accessoriesMenHeaders = {
       'Accept': '*/*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5',
        'Connection': 'keep-alive',
        'Cookie': '_ym_uid=1733236184663775395; _ym_d=1733236184; _ga=GA1.1.1011185662.1733236185; gender=men; _ym_isad=1; _ym_visorc=w; _ga_KDREW63Q0N=GS1.1.1737893964.27.0.1737894061.60.0.929029935; ph_phc_hDXjOarYgxpEWNaBeHLnG9xnOcDoOq3ghdXldbJsX81_posthog=%7B%22distinct_id%22%3A%2201938ced-538d-78b9-887a-2567e48f6f06%22%2C%22%24sesid%22%3A%5B1737894280708%2C%220194a28d-1087-7e7f-9971-8a942e9b3665%22%2C1737893941383%5D%7D; _dd_s=rum=2&id=188d57ac-baa5-4566-bd70-2ddd774221d1&created=1737893941308&expire=1737895180702',
        'If-None-Match': 'W/"afec-8JDeFanGeq1DcYVCc7A62rcif18"',
        'Referer': 'https://unicorngo.ru/men/accessories',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'baggage': 'sentry-environment=production,sentry-release=OVN5nci_e59dfYK60RAEn,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=ea0505b7e8d94649acf8ab07c2e0943e,sentry-sample_rate=1,sentry-sampled=true',
        'sentry-trace': 'ea0505b7e8d94649acf8ab07c2e0943e-ab1f71a57b21e8de-1',
  }


  //const l = ${page};

  try {
    for (let page = 1; page <= 26; page++) {
      console.log(page);
      const res = await fetch(`https://unicorngo.ru/api/catalog/product?sort=by-relevance&fit=MALE&fit=UNISEX&categorySlug=apparel%2Ffeatured_jacket%2Fdown_jacket&page=${page}&perPage=40`, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5",
          "baggage": "sentry-environment=production,sentry-release=QAk96-yyjjqvvtIIdqgHS,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=5018c906dc8a4469842ae0645ff9c22b,sentry-sample_rate=1,sentry-sampled=true",
          "if-none-match": "W/\"bb50-8UhV/xJa1HQyj+UGVi60Z4GM0yY\"",
          "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sentry-trace": "5018c906dc8a4469842ae0645ff9c22b-afb7f3cda7ffc569-1"
        },
        "referrer": "https://unicorngo.ru/men/apparel/featured_jacket/down_jacket?gender=man&sort=by-relevance",
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

        if (search) {
          obj.name = new RegExp(search, "i");
        }

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

      const sortOrder = sortDirection === 'cheap-first' ? 1 : sortDirection === 'expensive-first' ? -1 : null;

      let items = [];


      if (!search && sortOrder === null && !spuId && !category2Id
          && !category3Id && !sizes && !minPrice && !maxPrice && !colors && !brandId && !brandIds) {
        items = await ProductV6.aggregate([
          { $match: { ...productsV6buildRequest(), price: { $gt: 0 } } },
          { $sample: { size: Number(limit) } } // Случайный выбор `limit` товаров
        ]);
      } else {
        items = await ProductV6.find(productsV6buildRequest())
            .sort(sortOrder !== null ? { price: sortOrder } : {})
            .skip(offset)
            .limit(limit);
      }
      //console.log('items',items);


      const result = {items: items }

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

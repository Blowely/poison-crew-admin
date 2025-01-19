import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {Link} from "@/models/Link";
import {setTimeout} from "timers/promises";
import {ProductV6} from "@/models/ProductV6";
import {Skus} from "@/models/Skus";

async function fetchAndStoreProducts(req, res) {
  const baseUrl = 'https://unicorngo.ru/api/catalog/product';
  const headers = {
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

  try {
    for (let page = 1; page <= 26; page++) {
      const response = await axios.get(baseUrl, {
        headers,
        params: {
          sizeType: 'EU',
          sort: 'by-relevance',
          fit: ['MALE', 'UNISEX'],
          categorySlug: 'footwear/casual',
          page,
          perPage: 40
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
    }

    res.status(200).json({ message: 'Products fetched and stored successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching products.', error: error.message });
  }
}

async function findProductsBySize(req, res) {
  const size = req.query.size; // Получаем размер из параметров запроса

  if (!size) {
    return res.status(400).json({ message: 'Size parameter is required.' });
  }

  try {
    // Ищем товары, где любой элемент массива skus содержит переданный размер в поле size.eu
    const products = await ProductV6.find({
      skus: {
        $elemMatch: { 'size.eu': size }
      }
    });

    res.status(200).json(products);
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
      const categoryId = query?.categoryId || null;
      const level1CategoryId = query?.level1CategoryId || null;
      const level2CategoryId = query?.level2CategoryId || null;
      const offset = query?.page > 1 ? query?.page * query?.limit - 20 : 0;
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
        const {search, minPrice, maxPrice, sizeType, size} = reqObj;

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

        if (categoryId) {
          obj.categoryId = Number(categoryId);
        }

        if (size) {
          obj.skus = {
            $elemMatch: { 'size.eu': size, price: { $gt: 0 }  }
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

        // if (queryType !== 'admin') {
        //   obj.price = {$gt: 1}
        // }

        return obj;
      }

      const projection = {
        ...(isAdmin === false && { auth: 0 })
      };

      const sortOrder = sortDirection === 'asc' ? 1 : sortDirection === 'desc' ? -1 : null;

      const items = await ProductV6.find(productsV6buildRequest())
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
      const products = await ProductV6.find({}, 'spuId');

      for (const product of products) {
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

  /*if (method === 'POST') {
    try {
      await fetchAndStoreProducts(req, res);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }*/

  /*if (method === 'PATCH') {
    await updateProducts(req, res)
  }*/
}

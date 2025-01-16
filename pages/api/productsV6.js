import {mongooseConnect} from "@/lib/mongoose";
import {ProductV6} from "@/models/ProductV6";
import axios from "axios";

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

export default async function handle(req, res) {
  await mongooseConnect() //remove if run local;
  const {method, query} = req;



  /*if (method === 'POST') {
    try {
      await fetchAndStoreProducts(req, res);
    } catch (e) {
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }*/
}

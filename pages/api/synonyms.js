import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {Link} from "@/models/Link";
import {setTimeout} from "timers/promises";
import {ProductV6} from "@/models/ProductV6";
import {Skus} from "@/models/Skus";
import {APPAREL_SIZES, APPAREL_SIZES_MATCHES, COLOR_LIST} from "@/common/constants";
import {Synonym} from "@/models/Synonym";


export default async function handle(req, res) {
  await mongooseConnect() //remove if run local;
  const {method, query} = req;

  if (method === 'GET') {
    try {
      const search = query?.search?.toLowerCase() || '';

      // Создаём регулярное выражение для поиска слов, начинающихся с искомой строки
      const regex = new RegExp(`^${search}`, 'i');

      // Ищем в базе все записи, где хотя бы один синоним совпадает с паттерном
      const synonymsDocuments = await Synonym.find({
        synonyms: {$regex: regex}
      }).limit(10);

      // Собираем все подходящие синонимы из найденных документов
      let remoteSuggestions = synonymsDocuments
          .flatMap(doc => doc.synonyms)
          .filter(synonym => regex.test(synonym.toLowerCase()))
          .filter((value, index, self) => self.indexOf(value) === index) // Убираем дубликаты
          .slice(0, 8)

      const isSuggestionsIncludesSearch = () => remoteSuggestions?.includes(search?.trim())

      let allSuggestions = remoteSuggestions;

      allSuggestions = allSuggestions.map(el => ({value: el}));

      if (allSuggestions?.length === 0 && search) {
        const pipeline = [];

        pipeline.push({
          $search: {
            index: "autocomplete",
            autocomplete: {
              query: search.toString(),
              path: "name",
              fuzzy: { maxEdits: 2 },
            },
            highlight: {
              path: ["name"]
            }
          }
        });

        pipeline.push({ $limit: Number(13) });

        const remoteSuggestions = await ProductV6.aggregate(pipeline);

        const searchParts = search?.split(" ");
        const firstSearchPart = searchParts?.length > 1 ? searchParts[0] : "";

        allSuggestions = remoteSuggestions.map((el, i) => {

          return {value: `${firstSearchPart} ${el?.name}`.trim()}
        });

        if (remoteSuggestions[0]?.brand && remoteSuggestions[1]?.brand) {
          allSuggestions = [
              {value: `${firstSearchPart} ${remoteSuggestions[0]?.brand}`.trim()},
              {value: `${firstSearchPart} ${remoteSuggestions[1]?.brand}`.trim()},
              ...allSuggestions
          ];
        }

        allSuggestions = [
          ...new Map(allSuggestions.map(item => [item.value, item])).values()
        ];
      } else if (isSuggestionsIncludesSearch()) {
        // products
        const pipeline = [];

        pipeline.push({
          "$search": {
            "index": "default2",
            "compound": {
              "must": [ // Основные фильтры (И)
                {
                  "text": {
                    "query": search.trim().split(" "),
                    "path": ["category.category3", "brand"],
                    "synonyms": "ru_en_synonyms",
                  }
                }
              ],
              "should": [ // Дополнительные поля (ИЛИ)
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
                }
              ]
            }
          }
        });

        pipeline.push({ $limit: 20 });

        const remoteProducts = await ProductV6.aggregate(pipeline);

        allSuggestions = remoteProducts.map((el, i) => {
          return {value: `${search.trim()} ${el?.brand}`.trim()}
        });

        allSuggestions = [
          ...new Map(allSuggestions.map(item => [item.value, item])).values()
        ];
      }


      res.status(200).json({suggested: allSuggestions});
    } catch (e) {
      console.log('e =', e.message);
      res.status(500).json({
        status: 'internalServerError',
        items: [],
        message: 'Ошибка сервера'
      });
    }
  }

  /*if (method === 'POST') {
    const BRANDS = [
      { id: 10012, name: "Balenciaga" },
      { id: 1014958, name: "Beier" },
      { id: 1011859, name: "Belle" },
      { id: 1310, name: "Champion" },
      { id: 1009343, name: "Camel" },
      { id: 1001545, name: "Clarks" },
      { id: 176, name: "Converse" },
      { id: 10027, name: "Dickies" },
      { id: 1029895, name: "Eastern camel" },
      { id: 1003866, name: "Ecco" },
      { id: 1000666, name: "Feiyue" },
      { id: 1000491, name: "Fairwhale" },
      { id: 1318, name: "Fila" },
      { id: 1003100, name: "Fila fusion" },
      { id: 10112, name: "Giuseppe zanotti" },
      { id: 79, name: "Gucci" },
      { id: 1012433, name: "Hla" },
      { id: 1011227, name: "Hotwind" },
      { id: 1011738, name: "Huanqiu" },
      { id: 1023827, name: "Jane harlow" },
      { id: 1000952, name: "Jeep" },
      { id: 1011490, name: "Jeep spirit" },
      { id: 13, name: "Jordan", src: 'https://cdn-qiniu.poizonapp.com/news_byte3173byte_5c87bdf672c1b1858d994e281ce5f154_w150h150.png?x-oss-process=image/format,webp/resize,w_120,h_120' },
      { id: 10387, name: "Kappa" },
      { id: 1026902, name: "Kinddog" },
      { id: 10176, name: "Louis vuitton" },
      { id: 10347, name: "Mlb" },
      { id: 10230, name: "Michael kors" },
      { id: 1318, name: "Mihara yasuhiro" },
      { id: 1024327, name: "Medd" },
      { id: 144, name: "Nike", src: 'https://cdn-qiniu.poizonapp.com/news_byte3724byte_94276b9b2c7361e9fa70da69894d2e91_w150h150.png?x-oss-process=image/format,webp/resize,w_120,h_120' },
      { id: 4, name: "New balance", src: 'https://cdn-qiniu.poizonapp.com/news_byte6189byte_1cb7717a44b335651ad4656610142591_w150h150.png?x-oss-process=image/format,webp/resize,w_120,h_120' },
      { id: 10098, name: "Onitsuka tiger" },
      { id: 1000043, name: "Pony" },
      { id: 1029811, name: "Peimeng" },
      { id: 2, name: "Puma" },
      { id: 6, name: "Reebok" },
      { id: 1024161, name: "Simba's pride" },
      { id: 10336, name: "Skechers" },
      { id: 1003042, name: "Slazenger" },
      { id: 1014710, name: "Septwolves" },
      { id: 1020062, name: "Tonybear" },
      { id: 1021840, name: "Urban authentic" },
      { id: 1034049, name: "Vancamel" },
      { id: 9, name: "Vans" },
      { id: 1007140, name: "Vicki brown" },
      { id: 1000460, name: "Warrior" },
      { id: 10002, name: "Y-3" },
      { id: 1007807, name: "Zro" }
    ];

// Простой транслитератор латиницы в кириллицу
    const transliterate = (str) => {
      const converter = {
        'a': 'а', 'b': 'б', 'c': 'к', 'd': 'д', 'e': 'е', 'f': 'ф',
        'g': 'г', 'h': 'х', 'i': 'и', 'j': 'дж', 'k': 'к', 'l': 'л',
        'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'q': 'к', 'r': 'р',
        's': 'с', 't': 'т', 'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс',
        'y': 'и', 'z': 'з', ' ': ' ', '-': ''
      };

      return str.toLowerCase()
          .replace(/mc/gi, 'мак')
          .replace(/ck/gi, 'к')
          .split('')
          .map(char => converter[char] || char)
          .join('');
    };

    const generateBrandSynonyms = (brandName) => {
      const lowerName = brandName.toLowerCase().replace(/\s+/g, ' ');
      const basicCyrillic = transliterate(lowerName);

      const variations = new Set([
        lowerName,
        basicCyrillic,
        basicCyrillic.replace(/\s+/g, ''),
        basicCyrillic.replace(/(.)\1+/g, '$1') // Удаление дублирующихся букв
      ]);

      // Ручные правки для популярных брендов
      const manualSynonyms = {
        'nike': ['найк', 'наик', 'наек'],
        'adidas': ['адидас', 'адид', 'адик'],
        'puma': ['пума', 'пьюма'],
        'reebok': ['рибок', 'рибек'],
        'gucci': ['гучи', 'гуцци']
      };

      if (manualSynonyms[lowerName]) {
        manualSynonyms[lowerName].forEach(v => variations.add(v));
      }

      return Array.from(variations).filter(Boolean);
    };

    async function seedBrands() {
      try {
        for (const brand of BRANDS) {
          const synonyms = generateBrandSynonyms(brand.name);

          await Synonym.updateOne(
              { synonyms: { $in: synonyms } },
              {
                $setOnInsert: {
                  mappingType: 'equivalent',
                  synonyms,
                  brandId: brand.id,
                }
              },
              { upsert: true }
          );
        }
        console.log('Бренды успешно добавлены в синонимы');
      } catch (e) {
        console.error('Ошибка при добавлении брендов:', e);
      }
    }

    seedBrands();
  }*/


  /*if (method === 'GET') {
    try {

      // Получаем все уникальные значения category.category3

      const synonymsData = [
        {
          "_id": { "$oid": "67e5c03315ed1667ee48975b" },
          "mappingType": "equivalent",
          "synonyms": ["brooch", "брошь", "брошки", "заколка", "украшение"]
        }
      ]


      for (const item of synonymsData) {
        await Synonym.create({mappingType: item.mappingType, synonyms: item.synonyms});
      }


    } catch (error) {
      console.error('❌ Ошибка:', error);
    } finally {
      console.log('🔌 Соединение с MongoDB закрыто');
    }
  }*/

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

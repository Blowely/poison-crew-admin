import {mongooseConnect} from "@/lib/mongoose";
import axios from "axios";
import {Link} from "@/models/Link";
import {setTimeout} from "timers/promises";
import {ProductV6} from "@/models/ProductV6";
import {Skus} from "@/models/Skus";
import {APPAREL_SIZES, APPAREL_SIZES_MATCHES, COLOR_LIST} from "@/common/constants";
import fs from "fs";
import {Synonym} from "@/models/Synonym";
import {isValidStringWithSpaces} from "@/common/utils";

async function fetchAndStoreProducts(req, res) {
  try {
    for (let page = 1; page <= 26; page++) {
      console.log(page);
      const res = await fetch(`https://unicorngo.ru/api/catalog/product-v2?sort=search-relevance&search=nike%20dunk&brands=Nike&page=${page}&perPage=40`, {
        "headers": {
          "baggage": "sentry-environment=vercel-production,sentry-release=9d23f3dd566206a035acac60e2b287c2c7e1f9a8,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=14758f2bd74945348a9350bb5b945d5c,sentry-sample_rate=1,sentry-sampled=true",
          "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sentry-trace": "2c5857b2003f47678d702618ad1480ed-be3c4c86fd71be44-1"
        },
        "referrer": "https://unicorngo.ru/search-page?sort=search-relevance&search=nike%20dunk",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit"
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
        const {minPrice, maxPrice, sizeType, sizes} = reqObj;

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
        if (!isValidStringWithSpaces(search)) {
          return res.status(200).json({ items });
        }
        // Используем MongoDB Atlas Search
        // Собираем конвейер для aggregate
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
                    "query": "nike",
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

  /*if (method === 'GET') {
    try {

      // Получаем все уникальные значения category.category3

      const synonymsData = [
        {
          "_id": { "$oid": "67e5c03315ed1667ee48975b" },
          "mappingType": "equivalent",
          "synonyms": ["brooch", "брошь", "брошки", "заколка", "украшение"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48975c" },
          "mappingType": "equivalent",
          "synonyms": ["key_chain", "брелок", "брелоки", "ключница", "подвеска"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48975d" },
          "mappingType": "equivalent",
          "synonyms": ["other", "другое", "прочее", "иное", "разное"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48975e" },
          "mappingType": "equivalent",
          "synonyms": ["tie", "галстук", "галстуки", "бабочка", "галстучный аксессуар"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48975f" },
          "mappingType": "equivalent",
          "synonyms": ["backpack", "рюкзак", "ранец", "рюкзаки", "ранцы"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489760" },
          "mappingType": "equivalent",
          "synonyms": ["brief_case", "портфель", "дипломат", "портфели", "деловая сумка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489761" },
          "mappingType": "equivalent",
          "synonyms": ["card_holder", "визитница", "картхолдер", "кошелек для карт", "картодержатель"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489762" },
          "mappingType": "equivalent",
          "synonyms": ["chest_bag", "нагрудная сумка", "грудной рюкзак", "нагрудники", "поясная сумка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489763" },
          "mappingType": "equivalent",
          "synonyms": ["diagonal_bag", "диагональная сумка", "кросс-боди", "сумка через плечо", "космичка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489764" },
          "mappingType": "equivalent",
          "synonyms": ["fanny_pack", "поясная сумка", "бананка", "бельтик", "поясные сумки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489765" },
          "mappingType": "equivalent",
          "synonyms": ["gym_bag", "спортивная сумка", "сумка для спортзала", "спортивные сумки", "экипировочная сумка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489766" },
          "mappingType": "equivalent",
          "synonyms": ["headphone_bag", "чехол для наушников", "сумка для наушников", "чехлы для наушников", "аксессуар для наушников"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489767" },
          "mappingType": "equivalent",
          "synonyms": ["key_case", "ключница", "футляр для ключей", "ключницы", "органайзер для ключей"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489768" },
          "mappingType": "equivalent",
          "synonyms": ["makeup_bag", "косметичка", "сумка для косметики", "косметички", "косметический органайзер"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489769" },
          "mappingType": "equivalent",
          "synonyms": ["mobile_phone_bag", "чехол для телефона", "сумка для телефона", "чехлы для телефонов", "телефонный аксессуар"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48976a" },
          "mappingType": "equivalent",
          "synonyms": ["passport_sentence", "обложка для паспорта", "паспортная книжка", "паспортные обложки", "кожух для паспорта"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48976b" },
          "mappingType": "equivalent",
          "synonyms": ["storage_box", "коробка для хранения", "хранилище", "коробки для хранения", "органайзер"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48976c" },
          "mappingType": "equivalent",
          "synonyms": ["tote", "холщовая сумка", "шоппер", "сумки-шопперы", "большая сумка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48976d" },
          "mappingType": "equivalent",
          "synonyms": ["underarm_bag", "сумка под мышку", "клатч", "сумки-клатчи", "мини-сумка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48976e" },
          "mappingType": "equivalent",
          "synonyms": ["wallet", "кошелек", "бумажник", "кошельки", "портмоне"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48976f" },
          "mappingType": "equivalent",
          "synonyms": ["bag_peripheral", "аксессуар для сумки", "декор для сумок", "сумка-аксессуар", "дополнение к сумке"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489770" },
          "mappingType": "equivalent",
          "synonyms": ["tape", "лента", "тесьма", "ленты", "декоративная лента"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489771" },
          "mappingType": "equivalent",
          "synonyms": ["belt", "ремень", "пояс", "ремни", "пояса"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489772" },
          "mappingType": "equivalent",
          "synonyms": ["optical_frame", "оправа для очков", "очковая оправа", "оправы", "рамка для очков"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489773" },
          "mappingType": "equivalent",
          "synonyms": ["sunglasses", "солнцезащитные очки", "солнечные очки", "очки от солнца", "темные очки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489774" },
          "mappingType": "equivalent",
          "synonyms": ["headband", "повязка на голову", "ободок", "головные повязки", "бандана"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489775" },
          "mappingType": "equivalent",
          "synonyms": ["berets", "берет", "береты", "шляпа-берет", "головной убор"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489776" },
          "mappingType": "equivalent",
          "synonyms": ["fisherman", "рыбацкая шляпа", "шляпа рыбака", "рыбацкие шляпы", "панама"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489777" },
          "mappingType": "equivalent",
          "synonyms": ["fleece", "флис", "флисовая ткань", "флисовые вещи", "теплый материал"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489778" },
          "mappingType": "equivalent",
          "synonyms": ["peaked_cap", "кепка", "бейсболка", "кепки", "головной убор с козырьком"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489779" },
          "mappingType": "equivalent",
          "synonyms": ["bracelet", "браслет", "браслеты", "наручный браслет", "украшение на руку"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48977a" },
          "mappingType": "equivalent",
          "synonyms": ["bracelet2", "браслет (доп. вариант)", "второй браслет", "дополнительный браслет", "аксессуар на запястье"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48977b" },
          "mappingType": "equivalent",
          "synonyms": ["necklace", "ожерелье", "колье", "шейное украшение", "подвеска"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48977c" },
          "mappingType": "equivalent",
          "synonyms": ["pendant", "кулон", "подвеска", "кулоны", "украшение на шею"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48977d" },
          "mappingType": "equivalent",
          "synonyms": ["ring", "кольцо", "перстень", "кольца", "украшение на палец"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48977e" },
          "mappingType": "equivalent",
          "synonyms": ["wristband", "наручники", "браслет-плетенка", "резинка на запястье", "спортивный браслет"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48977f" },
          "mappingType": "equivalent",
          "synonyms": ["scarf", "шарф", "платок", "шейный платок", "кашне"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489780" },
          "mappingType": "equivalent",
          "synonyms": ["alarm_clock", "будильник", "часы с будильником", "электронный будильник", "механический будильник"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489781" },
          "mappingType": "equivalent",
          "synonyms": ["mechanical", "механические часы", "часы с механизмом", "автоматические часы", "механика"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489782" },
          "mappingType": "equivalent",
          "synonyms": ["quartz", "кварцевые часы", "часы на батарейке", "электронные часы", "кварц"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489783" },
          "mappingType": "equivalent",
          "synonyms": ["baseball_uniform", "бейсбольная форма", "форма для бейсбола", "бейсбольные комплекты", "экипировка бейсболиста"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489784" },
          "mappingType": "equivalent",
          "synonyms": ["coat", "пальто", "плащ", "пальто-плащ", "верхняя одежда"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489785" },
          "mappingType": "equivalent",
          "synonyms": ["cotton_clothes", "хлопковая одежда", "одежда из хлопка", "хлопковые вещи", "натуральные ткани"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489786" },
          "mappingType": "equivalent",
          "synonyms": ["denim_jacket", "джинсовка", "джинсовая куртка", "джинсовые куртки", "косуха"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489787" },
          "mappingType": "equivalent",
          "synonyms": ["down_jacket", "пуховик", "пуховая куртка", "зимняя куртка", "утепленная куртка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489788" },
          "mappingType": "equivalent",
          "synonyms": ["jacket", "куртка", "пиджак", "жакет", "верхняя одежда"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489789" },
          "mappingType": "equivalent",
          "synonyms": ["leather_jacket", "кожаная куртка", "косуха", "кожанка", "кожаный пиджак"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48978a" },
          "mappingType": "equivalent",
          "synonyms": ["suit", "костюм", "деловой костюм", "комплект", "тройка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48978b" },
          "mappingType": "equivalent",
          "synonyms": ["sun_protection", "защита от солнца", "солнцезащитная одежда", "UPF-одежда", "летняя защита"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48978c" },
          "mappingType": "equivalent",
          "synonyms": ["windbreaker", "ветровка", "ветрозащитная куртка", "легкая куртка", "демисезонная куртка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48978d" },
          "mappingType": "equivalent",
          "synonyms": ["hoodie", "худи", "толстовка", "худишки", "кофта с капюшоном"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48978e" },
          "mappingType": "equivalent",
          "synonyms": ["polo_shirt", "поло", "футболка-поло", "рубашка-поло", "тенниска"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48978f" },
          "mappingType": "equivalent",
          "synonyms": ["shirt", "рубашка", "сорочка", "рубахи", "мужская рубашка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489790" },
          "mappingType": "equivalent",
          "synonyms": ["sweater", "свитер", "джемпер", "водолазка", "теплый свитер"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489791" },
          "mappingType": "equivalent",
          "synonyms": ["t_shirt", "футболка", "тишотка", "майка", "тренч"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489792" },
          "mappingType": "equivalent",
          "synonyms": ["vest", "жилет", "безрукавка", "телогрейка", "жилетка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489793" },
          "mappingType": "equivalent",
          "synonyms": ["casual_shorts", "повседневные шорты", "обычные шорты", "городские шорты", "шорты-бермуды"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489794" },
          "mappingType": "equivalent",
          "synonyms": ["denim_short", "джинсовые шорты", "шорты из денима", "джинсовые бермуды", "короткие джинсы"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489795" },
          "mappingType": "equivalent",
          "synonyms": ["jeans", "джинсы", "деним", "брюки-джинсы", "джинсовая ткань"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489796" },
          "mappingType": "equivalent",
          "synonyms": ["overalls", "комбинезон", "сарафан-комбинезон", "рабочий комбинезон", "джинсовый комбинезон"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489797" },
          "mappingType": "equivalent",
          "synonyms": ["basketball_pants", "баскетбольные штаны", "спортивные брюки", "штаны для баскетбола", "спортивные трусы"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489798" },
          "mappingType": "equivalent",
          "synonyms": ["basketball_vest", "баскетбольный жилет", "майка для баскетбола", "спортивный жилет", "тренировочный топ"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee489799" },
          "mappingType": "equivalent",
          "synonyms": ["ski_pants", "лыжные штаны", "брюки для катания", "горнолыжные брюки", "термобрюки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48979a" },
          "mappingType": "equivalent",
          "synonyms": ["ski_suit", "лыжный костюм", "комбинезон для катания", "горнолыжный комплект", "зимний спортивный костюм"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48979b" },
          "mappingType": "equivalent",
          "synonyms": ["workout_clothes", "спортивная форма", "одежда для тренировок", "тренировочный комплект", "спортивный костюм"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48979c" },
          "mappingType": "equivalent",
          "synonyms": ["workout_pants", "спортивные штаны", "штаны для тренировок", "тренировочные брюки", "спортивные брюки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48979d" },
          "mappingType": "equivalent",
          "synonyms": ["boots", "ботинки", "сапоги", "зимняя обувь", "высокие ботинки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48979e" },
          "mappingType": "equivalent",
          "synonyms": ["chelsea", "челси", "ботинки челси", "классические челси", "кожаные челси"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee48979f" },
          "mappingType": "equivalent",
          "synonyms": ["martin", "мартинсы", "ботинки доктор мартинс", "грубые ботинки", "ботинки в стиле мартин"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a0" },
          "mappingType": "equivalent",
          "synonyms": ["outdoor", "туристическая обувь", "обувь для трекинга", "походные ботинки", "внедорожная обувь"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a1" },
          "mappingType": "equivalent",
          "synonyms": ["short", "ботинки короткие", "низкие ботинки", "полуботинки", "летние ботинки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a2" },
          "mappingType": "equivalent",
          "synonyms": ["snow", "снежные ботинки", "зимние ботинки", "обувь для снега", "утепленные ботинки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a3" },
          "mappingType": "equivalent",
          "synonyms": ["canvas", "кеды", "кроссовки из ткани", "холщовые кеды", "теннисные туфли"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a4" },
          "mappingType": "equivalent",
          "synonyms": ["daddy", "грубые ботинки", "ботинки в стиле гранж", "тяжелая обувь", "рабочие ботинки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a5" },
          "mappingType": "equivalent",
          "synonyms": ["sneakers", "кроссовки", "кеды", "спортивная обувь", "тенниски"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a6" },
          "mappingType": "equivalent",
          "synonyms": ["sport", "спортивная обувь", "кроссовки для спорта", "тренировочные кеды", "беговые кроссовки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a7" },
          "mappingType": "equivalent",
          "synonyms": ["vintage_basketball", "винтажные баскетбольные кроссовки", "ретро кеды", "классические кроссовки", "старые школьные кроссовки"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a8" },
          "mappingType": "equivalent",
          "synonyms": ["flip_flops", "вьетнамки", "шлепанцы", "пляжные тапочки", "сланцы"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897a9" },
          "mappingType": "equivalent",
          "synonyms": ["sport_sandals", "спортивные сандалии", "треккинговые сандалии", "походные сандалии", "сандалии для активного отдыха"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897aa" },
          "mappingType": "equivalent",
          "synonyms": ["badminton", "бадминтон", "игра в бадминтон", "спортивный инвентарь для бадминтона", "ракетки и воланчики"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897ab" },
          "mappingType": "equivalent",
          "synonyms": ["basketball", "баскетбол", "игра в баскетбол", "спортивный мяч", "баскетбольная площадка"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897ac" },
          "mappingType": "equivalent",
          "synonyms": ["cycling", "велоспорт", "езда на велосипеде", "велогонки", "велосипедный спорт"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897ad" },
          "mappingType": "equivalent",
          "synonyms": ["golf", "гольф", "игра в гольф", "гольф-клуб", "спортивное оборудование для гольфа"]
        },
        {
          "_id": { "$oid": "67e5c03315ed1667ee4897ae" },
          "mappingType": "equivalent",
          "synonyms": ["running", "бег", "беговой спорт", "легкая атлетика", "беговые тренировки"]
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
      let products = []
      if (!req.query?.spuId) {
        products = await ProductV6.find({ 'skus': { $size: 0 } }, 'spuId');
      }

      if (req.query?.spuId) {
        products = [{spuId: req.query?.spuId}]
        console.log('products',products);
      }


      let i = 0;

      for (const product of products) {
        i++
        console.log(i);
        const response = await axios.get(`${baseUrl}/${product.spuId}`, { headers });
        const updatedData = response.data;
        console.log('response',response.data);

        await ProductV6.updateOne(
          { spuId: product.spuId },
          { $set: updatedData }, {upsert: true },
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

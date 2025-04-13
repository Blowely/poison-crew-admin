export const customUrlBuilder = (url, params) => {
  const searchParams = new URLSearchParams(params);
  let newUrl = `${url}?`;
  const arrayParams= [];
  Object.entries(params).forEach(([key, value]) => {
    if (value instanceof Array) {
      searchParams.delete(key);
      // if (value.length) {
      //   newUrl += `${key}=${value.join(',')}&`;
      // }
      if (value.length) {
        arrayParams.push(...value.map((v) => `${key}=${v}`));
      }
    } else if (!value) {
      searchParams.delete(key);
    }
  });
  newUrl += arrayParams.join('&');

  const searchString = searchParams.toString();

  const result = [newUrl];

  if (searchString) {
    result.push(decodeURIComponent(searchParams.toString()));
  }

  return result.join('&');
};

export const getCurrentPriceOfSize = (size, sizesAndPrices) => {
  const foundSizeIndex = sizesAndPrices.findIndex(s => s.size === size);

  if (foundSizeIndex < 0) {
    return null;
  }

  const price = sizesAndPrices[foundSizeIndex].price;
  return price.toString().substring(0, price?.length - 2);
}

export function isNumeric(something){
  return typeof(something) === 'number';
}

export function isNumber(n){
  return Number(n)=== n;
}

export const productsV4buildRequest = (payload) => {
  const {search, category} = payload;

  const obj = {};

  if (search) {
    obj.title = new RegExp(search, "i");
  }

  if (category) {
    obj.category = new RegExp('.*' + category + '.*');
  }

  // if (queryType !== 'admin') {
  //   obj.price = {$gt: 1}
  // }

  return obj;
}

const getCheapestPrice = (prices) => {
  let cheapest = null;
  const sortedPrices = [...prices].sort(function (a, b) {
    return a - b;
  });

  for (let i = 0; i < sortedPrices.length; i++) {
    if (!isNumber(sortedPrices[i])) {
      continue;
    }
    cheapest = sortedPrices[i];
    break;
  }
  return cheapest;
}

const getClearTitle = (name) => {
  // Проверка наличия английских букв
  const hasEnglish = /[a-zA-Z]/.test(name);

  if (hasEnglish) {
    // Удаление спецсимволов "【" и "】" перед английским названием
    name = name.replace(/^【.*?】\s*/, '');

    // Добавление пробелов между английскими буквами, цифрами, спецсимволами и китайскими символами
    name = name.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
      .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
      .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
      .replace(/([a-zA-Z0-9])([\W_])/g, '$1 $2')
      .replace(/([\W_])([a-zA-Z0-9])/g, '$1 $2');

    // Повторное удаление китайских символов после добавления пробелов
    name = name.replace(/[\u4e00-\u9fa5]/g, '');

    // Удаление возможных оставшихся китайских символов вместе с прилегающими пробелами
    name = name.replace(/\s*[\u4e00-\u9fa5]+\s*/g, '');
  }

  // Удаление лишних пробелов внутри строки
  name = name.replace(/\s+/g, ' ').trim();

  return name;
}

export const handlePoizonProductResponse = (poizonProduct) => {
  try {
    const title = poizonProduct?.data?.detail?.title || "";
    const clearTitle = getClearTitle(title || "");
    const data = poizonProduct?.data || {};

    if (!title) {
      const spuId = data?.detail?.spuId || "";

      const payload = {
        spuId,
        title: '',
        cheapestPrice: '',
        sizesAndPrices: [],
        images: [],
        sizeInfoList: [],
        isDeleted: true,
      }

      console.log('deleted');
      return payload
    }


    const images = data?.image?.spuImage?.images?.map(({url}) => url) || [];
    const skuInfoList = data?.layerModel?.layer?.skuInfoList || [];
    const skus = data?.skus || [];
    const salePropertiesList = data?.saleProperties?.list || [];
    const spuId = data?.detail?.spuId || "";
    const categoryName = data?.detail?.categoryName || "";
    const categoryId = data?.detail?.categoryId || "";
    const level1CategoryId = data?.detail?.level1CategoryId || "";
    const level2CategoryId = data?.detail?.level2CategoryId || "";
    const brandId = data?.detail?.brandId || "";
    const sizeInfoList = data?.sizeDto?.sizeInfo?.sizeTemplate?.list || [];
    const arSkuIdRelation = data?.image?.spuImage?.arSkuIdRelation || [];
    const brandName = data?.brandRootInfo?.brandItemList[0]?.brandName || "";
    const brandLogo = data?.brandRootInfo?.brandItemList[0]?.brandLogo || "";

    const pricesAndSkuIds = []
    const prices = [];

    skuInfoList.forEach((el) => {
      const {skuId, tradeChannelInfoList} = el;
      if (tradeChannelInfoList[0]?.tradeType === 95) {
        return;
      }

      const optimalPrice = tradeChannelInfoList[0]?.optimalPrice * 13.4 + 100000;
      const item = {
        skuId,
        price: optimalPrice,
        flagUrl: tradeChannelInfoList[0]?.flagUrl,
      }

      prices.push(optimalPrice)
      pricesAndSkuIds.push(item);
    })

    const sizesAndPrices = pricesAndSkuIds.map((el) => {
      const {properties} = skus.find(({skuId}) => skuId === el?.skuId);

      const propertySizeObj = salePropertiesList.find((el) => el?.propertyValueId === properties[properties.length - 1]?.propertyValueId)

      return {...el, size: propertySizeObj?.value};
    })

    return {
      spuId,
      title,
      clearTitle,
      cheapestPrice: getCheapestPrice(prices),
      sizesAndPrices,
      brandId,
      brandName,
      brandLogo,
      images,
      categoryName,
      categoryId,
      level1CategoryId,
      level2CategoryId,
      sizeInfoList,
      skus,
      salePropertiesList,
      arSkuIdRelation,
      isDeleted: false
    };
  } catch (error) {
    console.error('Error :', error.message);
  }
}

export const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export function isValidStringWithSpaces(text) {
  return /^[A-Za-zА-Яа-яЁё\d\s]+$/.test(text);
}

export function replaceSpecialCharsWithSpaces(str) {
  // Заменяем все не-буквенно-цифровые символы на пробелы
  return str.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g, ' ');
}
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

  const obj = {
    ...payload
  };

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

export const handlePoizonProductResponse = (poizonProduct) => {
  try {
    const title = poizonProduct?.data?.detail?.title || "";

    if (!title) {
      const str = JSON.stringify(poizonProduct);
      const spuIdIndex = str.indexOf('spuId=');
      const spuIdStartValueIndex = spuIdIndex + 6;
      let spuIdEndValueIndex = spuIdIndex + 13;
      let spuId = str.substring(spuIdStartValueIndex, spuIdEndValueIndex);

      while (spuId.includes('&') && spuIdEndValueIndex--) {
        spuId = str.substring(spuIdStartValueIndex, spuIdEndValueIndex);
      }

      if (!spuId) {
        return 'error. spuId is not defined';
      }

      const payload = {
        spuId,
        title: '',
        cheapestPrice: '',
        sizesAndPrices: [],
        category: '66029ec83d545163a2435edb',
        brand: 'nike',
        images: [],
        sizeInfoList: [],
        isDeleted: true,
      }

      console.log('deleted');
      return payload
    }

    const data = poizonProduct?.data || {};
    const images = data?.image?.spuImage?.images?.map(({url}) => url) || [];
    const skuInfoList = data?.layerModel?.layer?.skuInfoList || [];
    const skus = data?.skus || [];
    const salePropertiesList = data?.saleProperties?.list || [];
    const spuId = data?.detail?.spuId || "";
    const sizeInfoList = data?.sizeDto?.sizeInfo?.sizeTemplate?.list || [];

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
      cheapestPrice: getCheapestPrice(prices),
      sizesAndPrices,
      category: '66029ec83d545163a2435edb',
      brand: 'nike',
      images,
      sizeInfoList,
      isDeleted: false
    };
  } catch (error) {
    console.error('Error :', error.message);
  }
}
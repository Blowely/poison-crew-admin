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

export const getCurrentPriceOfSize = (size, sizes) => {
  const foundSizeIndex = sizes.findIndex(s => s.size === size);

  if (foundSizeIndex < 0) {
    return null;
  }

  return Number(sizes[foundSizeIndex].price);
}

export function isNumeric(something){
  return typeof(something) === 'number';
}

export function isNumber(n){
  return Number(n)=== n;
}
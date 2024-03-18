import multiparty from 'multiparty';
import fs from 'fs';
import {mongooseConnect} from "@/lib/mongoose";
//import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import axios from "axios";
import probe from "probe-image-size";
import {isNumber, isNumeric} from "@/common/utils";


const bucketName = process.env.YANDEX_BUCKET_NAME;
const REGION = 'ru-central1';
const ENDPOINT = 'https://storage.yandexcloud.net';

export default async function handle(req,res) {
  await mongooseConnect();
  //await isAdminRequest(req,res);

  const form = new multiparty.Form();
  const {fields,files} = await new Promise((resolve,reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({fields,files});
    });
  });

  let isIphone12 = true;
  function base64_encode(file) {
    let bitmap = fs.readFileSync(file);
    const probeImg = probe.sync(bitmap);

    if (probeImg?.height < 2530) {
      isIphone12 = false;
    }

    return new Buffer(bitmap).toString('base64');
  }

  const links = [];
  let initialBase64Img = '';
  for (const file of files.file) {
    initialBase64Img = base64_encode(file.path);
  }

  const body = {
    "image_url": "https://storage.yandexcloud.net/pc-mediafiles-dev3/1710761229740.jpg",
  }

  const authToken = '772de3cf3fc2a4594f5676e319a6d2b25605ae1f';

  const options = {
    method: 'POST',
    url: 'https://www.imagetotext.info/api/imageToText',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    data: JSON.stringify(body),
  };

  const response = await axios(options);

  const resultBlocksStr = response.data.result;
  fs.writeFileSync('./output.json', JSON.stringify(resultBlocksStr));

  const resArr = resultBlocksStr.split('<br />\r\n');

  const sizes = [];
  const prices = [];

  let legitCheckPrice = null;
  let isGlobalShopping = false;
  let selectedSizeValue = null;
  let selectedLinkEndingValue = null;

  const isButton = (el,i) => {
    if (i > 2) {
      return false
    }

    if (el.includes('|') || el.includes('约') || el.includes('天')) {
      return true;
    }
  }

  const isGlobalShoppingCheck = (el) => {
    return el.includes('全球购');
  }

  const isLegitCheckPriceDiscount = (arr, i) => {
    return isButton(arr[i + 1]);
  }

  const getButtonLegitCheckPrice = (el) => {
    const parts = el.split(' ')//¥399 | 约6-7天到

    for (let part of parts) {
      if (part.includes('¥')) {
        const yuanIndex = part.indexOf('¥');
        return part.substring(yuanIndex);
      }
    }

    return null;
  }

  const isTablePrice = (el) => {
    if (el.includes(' ')) {
      return false;
    }

    return el.includes('¥') || el.includes('--');
  }

  const isFractional = (el) => {
    return el.includes('.')
  }

  const isTableSize = (el, i, arr) => {
    const numberedEl = Number(el);
    let isValidLength = el?.length > 2 ? isFractional(el) : true;

    return arr[i + 1] !== 'Total'
      && isNumber(numberedEl)
      && isNumeric(numberedEl)
      && el.length > 1
      && prices.length
      && !el.includes("\r")
      && isValidLength
  }

  const isSelectedSizeTitle = (el) => {
    return el.includes('♡') || el.includes('已');
  }

  const getSelectedSizeValue = (el) => {
    const symbols = el.trim().replace(/\s/g, "").slice(0, -1).split('').reverse()
    let size = '';
    let sizeLength = el.includes('.') ? 4 : 2;

    symbols.forEach((el, i) => {
      const numSymb = Number(el);
      if ((isNumber(numSymb) || el === '.') && size.length !== sizeLength) {
        size += symbols[i];
      }
    })

    return size.split('').reverse().join('');
  }

  const isLinkEndingValue = (arr, i) => {
    const spaceCheck = arr[i].split(' ');
    if (arr[i].length !== 8 || spaceCheck.length > 1) {
      return false
    }
    return arr[i - 1].includes('Total');
  }

  const getCheapestPrice = (prices) => {
    let cheapest = null;
    const sortedPrices = [...prices].sort();

    for (let i = 0; i < sortedPrices.length; i++) {
      if (!isNumber(sortedPrices[i])) {
        continue;
      }
      cheapest = sortedPrices[i];
      break;
    }
    return cheapest;
  }

  resArr.reverse().forEach((el,i,arr) => {
    if (!el?.length) {
      return null;
    }

    if (isButton(el,i)) {
      legitCheckPrice = Number(getButtonLegitCheckPrice(el).slice(1));
      return;
    }

    if (isGlobalShoppingCheck(el)) {
      isGlobalShopping = true;
      return;
    }

    if (isTablePrice(el)) {
      if (selectedSizeValue) {
        return;
      }

      if (isLegitCheckPriceDiscount(arr, i)) {
        return;
      }

      return prices.push(el.includes('--') ? '--' : Number(el.slice(1)));
    }

    if (isTableSize(el, i, arr)) {
      return sizes.push(el);
    }

    if (isSelectedSizeTitle(el)) {
      if (selectedSizeValue) {
        return
      }
      selectedSizeValue = getSelectedSizeValue(el);
      return;
    }

    if (isLinkEndingValue(arr, i)) {
      if (selectedLinkEndingValue) {
        return;
      }
      selectedLinkEndingValue = el;
    }
  })

  const needToChangeSizeIndex = sizes.indexOf(selectedSizeValue)
  if (needToChangeSizeIndex >= 0 && prices[needToChangeSizeIndex] !== '--') {
    prices[needToChangeSizeIndex] = legitCheckPrice;
  }

  const cheapestPrice = getCheapestPrice(prices);

  const result = {
    resArr,
    sizes,
    prices,
    selectedLinkEndingValue,
    selectedSizeValue,
    legitCheckPrice,
    cheapestPrice,
    isGlobalShopping,
    cost: 0.14
  }

  if (prices.length !== sizes.length) {
    if (sizes.length - prices.length === 3) {
      return res.json({...result, isNeedRecheck: true });
    }

    const body = {
      "image_url": "https://storage.yandexcloud.net/pc-mediafiles-dev3/1710752344452.jpg",
    }

    const options = {
      method: 'POST',
      url: 'http://localhost:3000/api/recognizeV3',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      data: JSON.stringify(body),
    }

    const resV3 = await axios(options).catch(console.log);
    return res.json(resV3?.data);
  }

  return res.json(result);
}

export const config = {
  api: {bodyParser: false},
};
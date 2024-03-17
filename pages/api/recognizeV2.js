import multiparty from 'multiparty';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import fs from 'fs';
import mime from 'mime-types';
import {mongooseConnect} from "@/lib/mongoose";
//import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import {getIAM} from "@/yandexService/getIAMToken";
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
    "image_url": "https://storage.yandexcloud.net/pc-mediafiles-dev3/1710679989883.jpg",
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

 /* const response = await axios(options);

  const resultBlocksStr = response.data.result;
  fs.writeFileSync('./output.json', JSON.stringify(resultBlocksStr));

  const resArr = resultBlocksStr.split('<br />\r\n');*/

  const resArr = [
    "¥349 | 约1-3天到",
    "¥359 | 约5-6天到",
    "全新微瑕",
    "95",
    "¥--",
    "¥--",
    "¥1319",
    "¥--",
    "46.5",
    "48",
    "47.5",
    "46",
    "515",
    "45",
    "¥999",
    "¥819",
    "¥--",
    "44.5",
    "44",
    "43",
    "¥1099",
    "¥989",
    "¥1099",
    "¥--",
    "42.5",
    "42",
    "41",
    "40.5",
    "¥--",
    "¥--",
    "¥--",
    "¥--",
    "40",
    "39",
    "38.5",
    "38",
    "¥899",
    "¥379",
    "¥359",
    "¥--",
    "37.5",
    "36.5",
    "36",
    "35.5",
    "1 + 为什么",
    "Go to",
    "包邮 32.15元/月起 &gt;",
    "¥359 已选 36♡",
    "6",
    "Total 14263 ite",
    "1d4iKDfQ",
    "O ✔api.re-poizon.ru/links",
    "查看尺码表",
    "100% 20:52",
    "GLOBE|MegaFon A",
    "﻿\r\n"
  ]

  const sizes = [];
  const prices = [];

  let legitCheckPrice = null;
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

  const getButtonLegitCheckPrice = (el) => {
    const parts = el.split(' ')//¥399 | 约6-7天到
    return parts[0];
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
    return arr[i + 1]?.includes('link') || arr[i + 1]?.includes('ru');
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

  resArr.forEach((el,i,arr) => {
    if (!el?.length) {
      return null;
    }

    if (isButton(el,i)) {
      legitCheckPrice = Number(getButtonLegitCheckPrice(el).slice(1));
      return;
    }

    if (isTablePrice(el)) {
      if (selectedSizeValue) {
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
    cost: 0.14
  }

  if (prices.length !== sizes.length) {
    if (sizes.length - prices.length === 3) {
      return res.json({...result, isNeedRecheck: true });
    }

    const body = {
      "image_url": "https://storage.yandexcloud.net/pc-mediafiles-dev3/1710707424864.jpg",
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
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
  try {
    await mongooseConnect();
    //await isAdminRequest(req,res);

    /*const form = new multiparty.Form();
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
    }*/

    const body = {
      "image_url": "https://storage.yandexcloud.net/pc-mediafiles-dev3/1710679989883.jpg",
    }

    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOWEyN2IzYzctMWJlMC00ZTFmLThmZjktMzU5ZjkzZGFhMDFmIiwidHlwZSI6ImFwaV90b2tlbiJ9.wHCh1F-3A4d4stHIIJjF5vURg2vOhvYVpWXjknruJB4';

    const options = {
      method: "POST",
      url: "https://api.edenai.run/v2/ocr/ocr",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        providers: "api4ai",
        language: "ch",
        file_url: body.image_url,
        fallback_providers: "",
      },
    };

    const response = await axios(options);
    console.log('response REQV3=',response)
    const resultBlocksStr = response.data?.api4ai?.text;

    fs.writeFileSync('./output.json', JSON.stringify(resultBlocksStr));

    const resArr = resultBlocksStr.split('\n');

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
        && prices.length > sizes.length
        && isNumber(numberedEl)
        && isNumeric(numberedEl)
        && el.length > 1
        && prices.length
        && !el.includes("\r")
        && isValidLength
    }

    const isSelectedSizeTitle = (el) => {
      return el.includes('♡');
    }

    const getSelectedSizeValue = (el) => {
      const symbols = el.trim().replace(/\s/g, "").split('').reverse()
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
      return arr[i + 1]?.includes('link');
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
    if (needToChangeSizeIndex >= 0) {
      prices[needToChangeSizeIndex] = legitCheckPrice;
    }

    const cheapestPrice = getCheapestPrice(prices);

    return res.json({
      resArr,
      sizes,
      prices,
      selectedLinkEndingValue,
      selectedSizeValue,
      legitCheckPrice,
      cheapestPrice
    });
  } catch (e) {
    console.log('err =', e);
  }
}

export const config = {
  api: {bodyParser: false},
};
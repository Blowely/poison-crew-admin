import multiparty from 'multiparty';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import fs from 'fs';
import mime from 'mime-types';
import {mongooseConnect} from "@/lib/mongoose";
//import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import {getIAM} from "@/yandexService/getIAMToken";
import axios from "axios";


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

  function base64_encode(file) {
    let bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
  }

  const links = [];
  let initialBase64Img = '';
  for (const file of files.file) {
    initialBase64Img = base64_encode(file.path);
  }

  const IAM = await getIAM();

  const body = {
    "folderId": process.env.YANDEX_IMG2TXT_FOLDER_IDDEX,
    "analyze_specs": [{
      "content": initialBase64Img,
      "features": [{
        "type": "TEXT_DETECTION",
        "text_detection_config": {
          "language_codes": ["*"]
        }
      }]
    }]
  }

  const options = {
    method: 'POST',
    url: 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${IAM}`,
    },
    data: JSON.stringify(body),
  };

  const response = await axios(options);

  let start = undefined;
  const resultBlocks = response.data.results[0].results[0].textDetection.pages[0].blocks.reverse();
  fs.writeFileSync('./output.json', JSON.stringify(resultBlocks));
  const entities = {
    sizes: [],
    prices: []
  }

  const notHandleEntities = {
    sizes: [],
    prices: []
  }

  let linePositionY = 0;
  let lastEntity = 'prices';

  for (let i = 0; i < resultBlocks.length; i++) {
    let elPosX = resultBlocks[i].boundingBox.vertices[0].x;
    let elPosY = resultBlocks[i].boundingBox.vertices[0].y;
    const text = resultBlocks[i].lines[0].words[0].text;
    console.log('text =', text);
    if (elPosY >= 2208) {
      continue;
    } else {
      start = i;
    }

    if (entities.sizes.length &&
      Math.abs(entities.sizes[entities.sizes.length-1].y - elPosY) >= 330)
    {
      break;
    }

    if (text.length > 4 && !text.startsWith('¥') &&
      !(Math.abs(elPosY - linePositionY) <= 110 && Math.abs(elPosY - linePositionY) >= -110))
    {
      break;
    }

    if (text.includes('码') || text.includes('已') || text.includes('选') || text.includes(']')) {
      break;
    }

    if (
      text.includes('要') ||
      text.includes('中') ||
      text.includes('款') ||
      text.includes('|'))
    {
      continue;
    }

    if (!entities.sizes.length && !entities.prices.length &&
      elPosY - resultBlocks[i + 1].boundingBox.vertices[0].y >= 120) {
      lastEntity = 'sizes';
    }

    if (!linePositionY) {
      linePositionY = elPosY;
    }

    let confidence = 1;

    const handleText = (text) => {
      let handledText = text.includes('%') ? text.replace('%', '.5') : text;
      handledText = handledText.replace('¥', '').replace('Y', '').replace('羊', '');

      if (handledText.length === 3 && handledText.endsWith('.')) {
        handledText += '5'
      }

      if (handledText.length === 1 && !text.startsWith('¥')
      ) {
        confidence = 0;
        handledText += '0';
      }

      return handledText;
    }

    let handledText = handleText(text);

    let newObj = {text: handledText, x: elPosX, y: elPosY };
    let notHandledNewObj = {text: text, x: elPosX, y: elPosY };

    if (!confidence) {
      newObj = {...newObj, confidence}
      notHandledNewObj = {...notHandledNewObj, confidence}
    }

    if (Math.abs(elPosY - linePositionY) <= 15 && Math.abs(elPosY - linePositionY) >= -15) {
      entities[lastEntity].push(newObj);
      notHandleEntities[lastEntity].push(notHandledNewObj);
    } else {
      lastEntity = lastEntity === 'prices' ? 'sizes' : 'prices';
      entities[lastEntity].push(newObj);
      notHandleEntities[lastEntity].push(notHandledNewObj);
      linePositionY = elPosY;
    }
  }

  console.log('notHandleEntities =', notHandleEntities);
  console.log('handledSizesBeforeRef ==', entities.sizes);

  let handledEntitySizes = JSON.parse((JSON.stringify(entities.sizes)));

  // refactoring sizes
  let prevSizesText = '';
  for (let i = 0; i < entities.sizes.length; i++) {
    let text = JSON.parse(JSON.stringify(entities.sizes[i].text));

    if (i !== 0 && text >= prevSizesText && entities.sizes[i]?.confidence ) {
      handledEntitySizes[i - 1].text = (Math.floor(Number(text)) + 1).toString();
    }

    if (text.length === 3) {
      const strArr = text.split('')
      strArr.splice(2, 0, '.');
      text = strArr.join('');
      handledEntitySizes[i].text = text;
    }

    prevSizesText = text;
  }

  console.log('handledEntitySizes ==', handledEntitySizes);
  console.log('handlePrices ==', entities.prices);
  // clean sizes
  const numReg =  /[\d.]/;
  let prevPosY = handledEntitySizes[0]?.y;
  handledEntitySizes = handledEntitySizes.filter((el) => {
    if (!numReg.test(el.text) || el.text.length < 2) {
      return false;
    }
    const isDiff = el.y - prevPosY > -400;
    prevPosY = el.y;
    return isDiff ;
  });

  //check not confidence sizes
  for (let i = 0; i < handledEntitySizes.length; i++) {
    if (handledEntitySizes[i]?.confidence === 0) {
      const currentValue = Number(handledEntitySizes[i].text);
      const prevSizeValue = Math.ceil(handledEntitySizes[i-1]?.text);
      const nextSizeValue = Math.floor(handledEntitySizes[i+1]?.text);

      if (
        currentValue + 1 === prevSizeValue &&
        currentValue - 1 === nextSizeValue
      ) {
        handledEntitySizes[i].confidence = 1;
      }
    }
    if (i > 0 && Math.ceil(handledEntitySizes[i].text) > Math.ceil(handledEntitySizes[i - 1].text)) {
      handledEntitySizes[i].confidence = 0;
    }
  }


  // clean prices
  entities.prices = entities.prices.filter((el, index) => {
    if (el.text.length <= 3 &&
      (notHandleEntities.prices[index].text.startsWith('¥') ||
        notHandleEntities.prices[index].text.startsWith('Y')))
    {
      return true;
    }
    return el.text.length >= 3;
  });

  // fill empty prices
  const sizes = [...handledEntitySizes];
  const prices = JSON.parse(JSON.stringify(entities.prices));
  for (let i = 0; i < sizes.length; i++) {
    if (
      prices[i]?.x &&
      Math.abs(sizes[i].x - prices[i].x) <= 70 &&
      Math.abs(prices[i].x - sizes[i].x) >= -70 &&
      Math.abs(sizes[i].y - prices[i].y) <= 100 &&
      Math.abs(prices[i].y - sizes[i].y) >= -100)
    {
      continue;
    } else {
      prices.splice(i, 0, {text: '--', x: sizes[i].x, y: sizes[i].y});
    }
  }

  console.log('entities =', {handledEntitySizes, prices});
  const items = handledEntitySizes.map((el, index) => {
    if (el?.confidence === 0) {
      return {
        size: el.text,
        price: prices[index].text,
        confidence: el.confidence
      }
    }
    return {
      size: el.text,
      price: prices[index].text
    }
  })

  const getCheapestPrice = () => {
    const regex = /^\d+$/;
    let cheapest = 0;
    prices.map(p => {
      if (!regex.test(p.text)) {
        return null;
      }

      if (p.text < cheapest || cheapest === 0) {
        return cheapest = p.text;
      }
    });
    return cheapest;
  }



  return res.json({items, cheapest_price: getCheapestPrice()});
}

export const config = {
  api: {bodyParser: false},
};
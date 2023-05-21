import multiparty from 'multiparty';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import fs from 'fs';
import mime from 'mime-types';
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import {getIAM} from "@/yandexService/getIAMToken";
import axios from "axios";


const bucketName = process.env.YANDEX_BUCKET_NAME;
const REGION = 'ru-central1';
const ENDPOINT = 'https://storage.yandexcloud.net';

export default async function handle(req,res) {
  await mongooseConnect();
  await isAdminRequest(req,res);

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

  const entities = {
    sizes: [],
    prices: []
  }

  let linePositionY = 0;
  let lastEntity = 'prices';

  let prevSizesText = '';

  for (let i = 0; i < resultBlocks.length; i++) {
    let elPosX = resultBlocks[i].boundingBox.vertices[0].x;
    let elPosY = resultBlocks[i].boundingBox.vertices[0].y;
    const text = resultBlocks[i].lines[0].words[0].text;

    if (elPosY >= 2208) {
      continue;
    } else {
      start = i;
    }

    if (text.length > 4) {
      break;
    }

    if (!linePositionY) {
      linePositionY = elPosY;
    }

    if (text.includes('要') || text.includes('中') || text.includes('款')) {
      continue;
    }
    /*if (lastEntity === 'sizes' && text >= prevSizesText) {
      entities.sizes.pop();
    }*/

      let handledText = text.includes('%') ?  resultBlocks[i].lines[0].words[0].text.replace('%', '.5') : text;
    handledText = handledText.replace('¥', '').replace('Y', '');

    if (handledText.length === 1) {
      handledText += '0';
    }

    if (Math.abs(elPosY - linePositionY) <= 10 && Math.abs(elPosY - linePositionY) >= -10) {
      entities[lastEntity].push({text: handledText, x: elPosX, y: elPosY });
    } else {
      lastEntity = lastEntity === 'prices' ? 'sizes' : 'prices';
      entities[lastEntity].push({text: handledText, x: elPosX, y: elPosY });
      linePositionY = elPosY;
    }

    if (lastEntity === 'sizes') {
      prevSizesText = text;
    }
  }


  // clean sizes
  const numReg =  /[\d.]/;
  let prevPosY = entities.sizes[0].y;
  entities.sizes = entities.sizes.filter((el) => {
    if (!numReg.test(el.text) || el.text.length < 2) {
      return false;
    }
    const isDiff = el.y - prevPosY > -400;
    prevPosY = el.y;
    return isDiff ;
  });

  // clean prices
  entities.prices = entities.prices.filter((el) => el.text.length >= 3);

  // fill empty prices
  const sizes = [...entities.sizes];
  const prices = JSON.parse(JSON.stringify(entities.prices));
  for (let i = 0; i < sizes.length; i++) {
    if (
      prices[i]?.x &&
      Math.abs(sizes[i].x - prices[i].x) <= 70 &&
      Math.abs(prices[i].x - sizes[i].x) >= -70)
    {
      continue;
    } else {
      prices.splice(i, 0, {text: '--', x: sizes[i].x, y: sizes[i].y});
    }
  }

  console.log('entities =', {sizes, prices});

  return res.json({sizes, prices});
}

export const config = {
  api: {bodyParser: false},
};
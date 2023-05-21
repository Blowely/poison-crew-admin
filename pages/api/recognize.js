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

  for (let i = 0; i < resultBlocks.length; i++) {
    let elPosY = resultBlocks[i].boundingBox.vertices[0].y;

    if (elPosY >= 2208) {
      continue;
    } else {
      start = i;
    }

    if (resultBlocks[i].lines[0].words[0].text.length > 4) {
      break;
    }

    if (!linePositionY) {
      linePositionY = elPosY;
    }

    const text = resultBlocks[i].lines[0].words[0].text;
    const handledText = text.includes('%') ?  resultBlocks[i].lines[0].words[0].text.replace('%', '.5') : text;

    if (Math.abs(elPosY - linePositionY) <= 10 && Math.abs(elPosY - linePositionY) >= -10) {
      entities[lastEntity].push(handledText);
    } else {
      lastEntity = lastEntity === 'prices' ? 'sizes' : 'prices';
      entities[lastEntity].push(handledText);
      linePositionY = elPosY;
    }
  }

  console.log('entities =', entities);

  return res.json({entities});
}

export const config = {
  api: {bodyParser: false},
};
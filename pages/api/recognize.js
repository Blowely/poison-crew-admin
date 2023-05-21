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
  console.log('response =', response);

  return res.json({links});
}

export const config = {
  api: {bodyParser: false},
};
import multiparty from 'multiparty';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import fs from 'fs';
import mime from 'mime-types';
import {mongooseConnect} from "@/lib/mongoose";
//import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import EasyYandexS3 from "easy-yandex-s3";

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

  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.S3_YANDEX_ID,
      secretAccessKey: process.env.S3_YANDEX_SECRET,
    },
    endpoint: ENDPOINT,
  });


  const links = [];
  for (const file of files.file) {
    const ext = file.originalFilename.split('.').pop();
    const newFilename = Date.now() + '.' + ext;

    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: newFilename,
      Body: fs.readFileSync(file.path),
      ACL: 'public-read',
      ContentType: mime.lookup(file.path),
    }));


    const link = `https://storage.yandexcloud.net/${bucketName}/${newFilename}`;
    console.log('link ', link)
    links.push(link);
  }
  return res.json({links});
}

export const config = {
  api: {bodyParser: false},
};
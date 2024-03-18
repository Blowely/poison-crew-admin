import fs from 'fs';
import {mongooseConnect} from "@/lib/mongoose";
//import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import axios from "axios";
import {isNumber, isNumeric} from "@/common/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import {Log} from "@/models/Log";
import {decryptToken} from "@/utils/utils";


const bucketName = process.env.YANDEX_BUCKET_NAME;
const REGION = 'ru-central1';
const ENDPOINT = 'https://storage.yandexcloud.net';

export default async function handle(req,res) {
  await mongooseConnect();
  const  {method, query} = req;

  if (method === 'POST') {
    try {
      const value = query?.value

      await Log.create({
        title:value
      })
      return res.json({})
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

export const config = {
  api: {bodyParser: false},
};
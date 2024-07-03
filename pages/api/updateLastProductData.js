import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";
import {ProductV2} from "@/models/ProductV2";
import {ProductV3} from "@/models/ProductV3";
import axios from "axios";
import {exec} from "child_process";
import PQueue from 'p-queue';
import { setTimeout } from "timers/promises";

const phoneApi = 'http://192.168.1.205:8016';
const ahkScriptPath = '"C:/Users/Azerty/Desktop/ahk/parseProductsGoBackToServer.exe"';

// Создание очереди задач с лимитом параллельного выполнения


const queue = new PQueue({ concurrency: 1 });

function runAHKScript(src) {
  return new Promise((resolve, reject) => {
    const response = axios(`${phoneApi}/dewulink://m.dewu.com/note?routerUrl=${src}`);

    exec(ahkScriptPath, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing AHK script: ${error}`);
        reject(error);
      } else {
        console.log(`AHK script executed successfully. Output: ${stdout}`);
        await setTimeout(3000)
        resolve();
      }
    });
  });
}

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  if (method === 'GET') {
    try {
      //const {phone} = decryptToken(query?.token);
      const queryType = query?.type;

      //const client = phone ? await Client.findOne({phone}) : null;
      //let projection = (client || phone === '79223955429') ? {} : {properties: 0};

      let items = [];
      let totalCount = undefined;
      let result = undefined;

      const src = req.query?.src;
      console.log('src =',src);

      queue.add(() => runAHKScript(src));


      res.send('Request added to queue.');

    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }

  if (method === 'PUT') {
    try {
      const {
        title,
        description,
        price,
        images,
        category,
        properties,
        sizesAndPrices,
        cheapestPrice,
        sizeInfoList,
        spuId,
        isDeleted
      } = req.body;

      const response = await ProductV3.updateOne({spuId}, {
        spuId,
        title,
        description,
        price,
        images,
        category,
        properties,
        sizesAndPrices,
        cheapestPrice,
        sizeInfoList,
        isDeleted
      });

      res.status(200);
      res.json({answer: response.data});
    } catch (e) {
      console.log('e =', e);
      res.status(500);
      res.json({status: 'internalServerError', message: 'Ошибка сервера'});
    }
  }
}

import {mongooseConnect} from "@/lib/mongoose";
import {ProductV3} from "@/models/ProductV3";
import {exec} from "child_process";
import PQueue from 'p-queue';
import { setTimeout } from "timers/promises";

const phoneApi = 'http://192.168.1.205:8016';
const ahkScriptPath = '"C:/Users/Azerty/Desktop/ahk/parseProductsGoBackToServer.exe"';

// Создание очереди задач с лимитом параллельного выполнения


const queue = new PQueue({ concurrency: 1 });

async function runAHKScript(spuId) {
  try {
    await setTimeout(200)
    await fetch(`${phoneApi}/https://poizon2hk.page.link/?link=https://hk.poizon.com/router/sell/productDetail?spuId=${spuId}&ibi=com.shizhuang.poizon.hk&isi=1509915974&efr=1`);
    //await fetch(`${phoneApi}/dewulink://m.dewu.com/note?routerUrl=${src}`);
    await setTimeout(500)

    return new Promise((resolve, reject) => {
      exec(ahkScriptPath, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Ошибка выполнения AHK-скрипта: ${error}`);
          reject(error);
        } else {
          console.log(`AHK-скрипт выполнен успешно. Осталось: ${queue.size}`);
          //await setTimeout(3000)
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(`Ошибка в runAHKScript: ${spuId} ${error}`);
  }
}

export default async function handle(req, res) {
  const {method, query} = req;

  if (method === 'GET') {
    try {
      const spuId = req.query?.spuId;
      console.log('spuId =',spuId);

      queue.add(() => runAHKScript(spuId));


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

      const response = await ProductV3.updateMany({spuId}, {
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

import {mongooseConnect} from "@/lib/mongoose";
import {ProductV3} from "@/models/ProductV3";
import {exec} from "child_process";
import PQueue from 'p-queue';
import { setTimeout } from "timers/promises";

const phoneApi = 'http://192.168.1.205:8016';
const ahkScriptPath = '"C:/Users/Azerty/Desktop/ahk/parseProductsGoBackToServer.exe"';

// Создание очереди задач с лимитом параллельного выполнения


const queue = new PQueue({ concurrency: 1 });

function runAHKScript(src) {
  return new Promise(async (resolve, reject) => {
    fetch(`${phoneApi}/dewulink://m.dewu.com/note?routerUrl=${src}`).catch(console.log);
    await setTimeout(1000)

    exec(ahkScriptPath, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing AHK script: ${error}`);
        reject(error);
      } else {
        console.log(`AHK script executed successfully. Output: ${stdout}`);
        await setTimeout(2500)
        resolve();
      }
    });
  });
}

export default async function handle(req, res) {
  const {method, query} = req;

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

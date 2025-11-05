import {mongooseConnect} from "@/lib/mongoose";
import {ProductV6} from "@/models/ProductV6";
import path from "path";
import fs from "fs";

export default async function handle(req, res) {
    await mongooseConnect() //remove if run local;
    const {method, query} = req;

    if (method === 'GET') {
        console.log('__dirname',__dirname);
       /* const outputPath = path.join(__dirname, 'output.json');
        const writeStream = fs.createWriteStream(outputPath, { flags: 'w' });

        try {
            writeStream.write('[\n'); // открытие массива

            const cursor = ProductV6.find({}, { spuId: 1, images: 1, _id: 0 }).cursor();

            let isFirst = true;
            let count = 0;

            for await (const doc of cursor) {
                const record = {
                    spuId: doc.spuId,
                    images: doc.images
                };

                if (!isFirst) writeStream.write(',\n');
                writeStream.write(JSON.stringify(record, null, 2));
                isFirst = false;
                console.log('count',count)
                count++;
                if (count % 1000 === 0) {
                    console.log(`✅ Обработано ${count} записей...`);
                }
            }

            writeStream.write('\n]');
            console.log(`🎉 Готово! Всего обработано: ${count} записей`);
        } catch (err) {
            console.error('❌ Ошибка:', err);
        } finally {
            writeStream.end();
        }*/

    }
}
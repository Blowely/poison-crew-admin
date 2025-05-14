import {Client} from "@/models/Client";
import {mongooseConnect} from "@/lib/mongoose";
import {decryptToken} from "@/utils/utils";

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();

  if (method === 'POST') {
    try {
      const { phone } = decryptToken(query?.token);

      const result = await Client.findOneAndDelete({ phone });

      if (result) {
        return res.status(200).json({ status: "ok", message: "Аккаунт успешно удален" });
      } else {
        return res.status(404).json({ status: "notFound", message: "Аккаунт не найден" });
      }
    } catch (e) {
      return res.status(500).json({ status: "internalServerError", message: "Ошибка при удалении", text: e?.message });
    }
  }
}
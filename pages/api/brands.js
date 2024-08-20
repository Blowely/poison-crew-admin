import {Category} from "@/models/Category";
import {mongooseConnect} from "@/lib/mongoose";
import {getServerSession} from "next-auth";
import {Brand} from "@/models/Brand";
//import {authOptions, isAdminRequest} from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  const {method, query} = req;
  await mongooseConnect();
  //await isAdminRequest(req,res);

  const categoryId = query?.categoryId || null;
  const limit = query?.limit || 20;


  if (method === 'GET') {
    const obj = {}

    /*if (categoryId) {
      obj.categoryId = categoryId
    }*/

    const items = await Brand.find(obj).limit(limit);

    res.json({items});
  }


  if (method === 'DELETE') {
    const {_id} = req.query;
    //await Brand.deleteOne({_id});
    res.json('ok');
  }
}
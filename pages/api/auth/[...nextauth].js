import NextAuth, {getServerSession} from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import {MongoDBAdapter} from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import Yandex from "next-auth/providers/yandex";

const adminEmails = ['maryashin.2014@yandex.ru'];

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET
    }),
    /*Yandex({
      clientId: process.env.YANDEX_ID,
      clientSecret: process.env.YANDEX_SECRET
    })*/
    Yandex({
      clientId: 'c85c88b5fb70492f9e6e49c4146dd61f',
      clientSecret: 'eedfca2f519948aaa82ee25ea6f834b8'
    }),
  ],

  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    session: ({session,token,user}) => {
      if (adminEmails.includes(session?.user?.email)) {
        return session;
      } else {
        return false;
      }
    },
  },
};

export default NextAuth(authOptions);

export async function isAdminRequest(req,res) {
  const session = await getServerSession(req,res,authOptions);
  if (!adminEmails.includes(session?.user?.email)) {
    res.status(401);
    res.end();
    throw 'not an admin';
  }
}

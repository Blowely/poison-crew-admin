import '@/styles/globals.css';
import "@/styles/pages.css";
import { SessionProvider } from "next-auth/react";
import {useEffect} from "react";
import Script from "next/script";

export default function App({Component, pageProps: { session, ...pageProps }}) {


  return (
    /*<SessionProvider session={session}>

    </SessionProvider>*/
    <Component {...pageProps}/>
  )
}

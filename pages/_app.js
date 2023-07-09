import '@/styles/globals.css';
import "@/styles/pages.css";
import { SessionProvider } from "next-auth/react";
import {useEffect} from "react";
import Script from "next/script";

export default function App({Component, pageProps: { session, ...pageProps }}) {

  const onLoadScript = () => {
    async function start() {
      // Создание экземпляра объекта Centrifuge
      window.centrifuge = new Centrifuge('wss://centrifugo.donatepay.ru:43002/connection/websocket', {
        subscribeEndpoint: 'https://donatepay.ru/api/v2/socket/token',
        subscribeParams:   {
          access_token: 'fsYHWYth7k1xnB2xv8D0LqPEdiBXv59vY5qk1QkftlgEUTJaIK9Ky4yty6ds'
        },
        disableWithCredentials: true
      });

      // Предоставляем токен подключения
      centrifuge.setToken(await getToken())

      // Подписываемся на канал пользователя $public:USER_ID
      centrifuge.subscribe("$public:1141948", function (message) {
        // Выводим все новые сообщения, полученные с канала в консоль
        console.log('message', message);
      });

      centrifuge.on('error', (e) => {
        console.log('error', e)
      })

      centrifuge.on('subscribe', (e) => {
        console.log('subscribe', e)
      })

      centrifuge.on('connect', (e) => {
        console.log(e)
      })

      // Метод фактического подключения к серверу
      centrifuge.connect();
    }

    // Request a token to connect to Centrifuge
    async function getToken() {
      var res = await fetch('https://donatepay.ru/api/v2/socket/token', {
        method: 'post',
        body: JSON.stringify({
          access_token: 'fsYHWYth7k1xnB2xv8D0LqPEdiBXv59vY5qk1QkftlgEUTJaIK9Ky4yty6ds'
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })

      return (await res.json()).token
    }

    start()
  }

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/gh/centrifugal/centrifuge-js@2.X.X/dist/centrifuge.min.js";
    script.onload = onLoadScript
    document.body.appendChild(script)




    return () => {
      // clean up the script when the component in unmounted
      /*document.body.removeChild(script)*/
    }
  }, []);



  return (
    /*<SessionProvider session={session}>

    </SessionProvider>*/
    <Component {...pageProps}/>
  )
}

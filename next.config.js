const {PHASE_DEVELOPMENT_SERVER} = require("next/constants");
const { Centrifuge, Subscription } = require('centrifuge');
global.WebSocket = require('ws');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  webpack(config, context) {
    config.module.rules.push(
      {
        test: /\.txt$/,
        use: 'raw-loader',
      }
    )
    return config
  }
}

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    const start = async () => {
      // Создание экземпляра объекта Centrifuge
      console.log(123);
      const centrifuge = new Centrifuge('wss://centrifugo.donatepay.ru:43002/connection/websocket', {
        /*subscribeEndpoint: 'https://donatepay.ru/api/v2/socket/token',
        subscribeParams: {
          access_token: 'fsYHWYth7k1xnB2xv8D0LqPEdiBXv59vY5qk1QkftlgEUTJaIK9Ky4yty6ds'
        },*/
        emulationEndpoint: 'https://donatepay.ru/api/v2/socket/token',
        token: 'fsYHWYth7k1xnB2xv8D0LqPEdiBXv59vY5qk1QkftlgEUTJaIK9Ky4yty6ds',
        //disableWithCredentials: true
      });

      // Предоставляем токен подключения
      centrifuge.setToken(await getToken())

      // Подписываемся на канал пользователя $public:USER_ID
      /*centrifuge.newSubscription("$public:1141948", function (message) {
        // Выводим все новые сообщения, полученные с канала в консоль
        console.log('SUBSCs')
        console.log('message', message);
      });*/
      centrifuge.newSubscription("$public:1141948", {
        token:'fsYHWYth7k1xnB2xv8D0LqPEdiBXv59vY5qk1QkftlgEUTJaIK9Ky4yty6ds',
      });

      const sub = new Subscription(centrifuge, "$public:1141948")
      sub.subscribe();

      sub.on('subscribing', (e) => console.log('e=',e))

      centrifuge.on('error', (e) => {
        console.log('error', e)
      })

      centrifuge.on('subscribed', (e) => {
        console.log('SUBSCRIBED')
        console.log('subscribe', e)
      })

      centrifuge.on('subscribing', (e) => {
        console.log('SUBSCRIBED')
        console.log('subscribe', e)
      })

      centrifuge.on('connecting', (e) => {
        console.log('connecting')
        console.log(e)
      })

      centrifuge.on('connected', (e) => {
        console.log('connected')
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

    start().catch((e) => console.log('e= ', e));
  }

  return nextConfig
}
import path from "path";

const jose = require('node-jose');
const fs = require('fs');
const axios = require("axios");

const key = fs.readFileSync(process.cwd() + '\\yandexService\\privateKeyIMG2TXT.txt', 'utf8');

const serviceAccountId = process.env.YANDEX_IMG2TXT_ISS_ID;
const keyId = process.env.YANDEX_IMG2TXT_KEY_ID;
const now = Math.floor(new Date().getTime() / 1000);

const payload = { aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
  iss: serviceAccountId,
  iat: now,
  exp: now + 3600 };


const getJWT = async () => {
  const res = await jose.JWK.asKey(key, 'pem', { kid: keyId, alg: 'PS256' })
  const signer = await jose.JWS.createSign({ format: 'compact' }, res).update(JSON.stringify(payload))
  return await signer.final();
}

export const getIAM = async () => {
  const jwt = await getJWT();
  const data = JSON.stringify({
    jwt
  })

  const result = await axios({
    url: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
    method: 'POST',
    headers: {
      "Content-Type": 'application/json'
    },
    data: data
  });
  console.log('result =', result);
  return result.data.iamToken;
}


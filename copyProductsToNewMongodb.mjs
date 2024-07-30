import axios from "axios";

(async () => {
  //for (let i = 1000000; i <= 1045404; i++) {
  for (let i = 1000000; i <= 1004500; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV4?spuId=${i}`)
      const data = await res.json();

      if (data) {
        const payload = {spuId: data?.spuId, auth: data?.auth}
        const res = await axios.post(`http://localhost:3001/api/productsV4`, payload);
        console.log('res.status =', `${res.status} ${i}`);
      }
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
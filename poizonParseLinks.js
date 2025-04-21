/*(async () => {
  for (let i = 2100000; i <= 2200000; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV4?spuId=${i}&competitor-check=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()*/

(async () => {
  for (let i = 1; i <= 43; i++) {
    try {
      const res = fetch(`http://localhost:3001/api/productsV6?f=${i}`, {method: "POST"});
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
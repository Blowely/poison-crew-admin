(async () => {
  for (let i = 1000000; i <= 1045404; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV4?spuId=${i}&update=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
(async () => {
  for (let i = 1000792; i <= 1020000; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV3?spuId=${i}&parse=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
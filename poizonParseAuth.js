(async () => {
  for (let i = 1001482; i <= 1002481; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV3?spuId=${i}&parse=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
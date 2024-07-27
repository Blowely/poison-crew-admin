(async () => {
  for (let i = 1005130; i <= 1027486; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV4?spuId=${i}&update=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
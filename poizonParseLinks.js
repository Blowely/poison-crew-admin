(async () => {
  for (let i = 2000050; i <= 2100000; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV4?spuId=${i}&competitor-check=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
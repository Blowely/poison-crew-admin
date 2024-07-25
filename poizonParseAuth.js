(async () => {
  for (let i = 1002486; i <= 1022486; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV3?spuId=${i}&parse=true`)
      //const res = await fetch(`http://localhost:3001/api/productsV3?spuId=${i}&parse=true`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
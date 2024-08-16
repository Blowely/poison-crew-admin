(async () => {
  for (let i = 0; i <= 80000; i++) {
    try {
      const res = await fetch(`https://api.re-poizon.ru/api/productsV4?exist-product=${i}&update=true`)
      // res = await fetch(`http://localhost:3001/api/productsV4?exist-product=${i}&update=true`)
      //const res = await fetch(`http://localhost:3001/api/productsV4?spuId=${i}&update=true`)
      const json = await res.json();
      console.log(`i = ${i} res = ${JSON.stringify(json)}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
(async () => {
  for (let i = 1000000; i <= 1000010; i++) {
    try {
      const res = await fetch(`http://localhost:3001/api/productsV4?spuId=${i}&update=true`)
      const json = await res.json();
      console.log(`i = ${i} res = ${JSON.stringify(json)}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
(async () => {
  for (let i = 1; i <= 10; i++) {
    try {
      const data = await fetch(`https://api.re-poizon.ru/api/productsV4?existLinkNumber=${i}`)
      const linkObj = await data.json();

      const res = await fetch(`http://localhost:3001/api/updateLastProductData?link=${linkObj.link}`)
      console.log(`i = ${i} res = ${res.ok}`)
    } catch (e) {
      console.log('e =', e?.message)
    }
  }
})()
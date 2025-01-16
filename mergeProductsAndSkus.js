const getPrice = async (skuId) => {
    try {
        const response = await fetch(`http://localhost:3001/api/productsV5?skuId=${skuId}`, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch price:", error);
        throw error;
    }
};

async function fetchSkuPrices(skus) {
    const prices = await Promise.all(
        skus?.map(async (sku) => {
            try {
                // Псевдозапрос к бэку для получения цены
                const response = await getPrice(sku.skuId);

                if (!response?.spuId) throw new Error(`Error fetching price for skuId ${sku.skuId}`);
                const {detail} = response;
                console.log('response',response);
                return { ...sku, price: detail.data.verticals[detail.data.verticals.length - 1] };
            } catch (error) {
                console.error(error);
                return { ...sku, price: null }; // Если произошла ошибка, цена будет null
            }
        })
    );
    return prices;
}

(async () => {
    for (let i = 0; i <= 1; i++) {
        try {
            //const res = await fetch(`https://api.re-poizon.ru/api/productsV4?exist-product=${i}&update=true`)
            const res = await fetch(`http://localhost:3001/api/productsV5?offset=${i}&limit=1`)
            const json = await res.json();
            const data = json.items[0].detail.data || {};

            // Создаем маппинг propertyValueId -> название размера
            const sizeMap = {};
            data.saleProperties?.list?.forEach((property) => {
                if (property.name === "尺碼" && property.propertyValueId) {
                    sizeMap[property.propertyValueId] = property.value;
                }
            });

            const mappedSkus = data.skus?.map((sku) => {
                const sizeProperty = sku.properties?.find(
                    (prop) => sizeMap[prop.propertyValueId]
                );

                return {
                    skuId: sku.skuId,
                    spuId: sku.spuId,
                    propertyValueId: sizeProperty?.propertyValueId || null,
                    size: sizeProperty ? sizeMap[sizeProperty.propertyValueId] : null
                };
            }) || [];

            const prices = await fetchSkuPrices(mappedSkus);

            const options = {
                method: 'PUT',
                body: JSON.stringify({spuId: json.items[0].spuId, sizesAndPrices: prices || []}),
            }

            await fetch(`http://localhost:3001/api/productsV5`, options);

            console.log(`i = ${i} res = ${JSON.stringify(prices.length)}`)
        } catch (e) {
            console.log('e =', e?.message)
        }
    }
})()
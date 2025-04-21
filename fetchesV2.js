
export const getFetchV2 = (i, page, sizeValue, sort, ga, gb, gc, pa, pb) => {
    switch (i) {
        case 1:
            // return fetch(`https://unicorngo.ru/api/catalog/product?sizeType=EU&sort=${sort}&fit=${ga}&fit=UNISEX&brands=Converse&sizeValue=${sizeValue}&priceFrom=${pa}&priceTo=${pb}&categorySlug=footwear&page=${page}&perPage=40`, {
            //return fetch(`https://unicorngo.ru/api/catalog/product?sizeType=EU&sort=${sort}&fit=${ga}&fit=UNISEX&sizeValue=${sizeValue}&priceFrom=${pa}&priceTo=${pb}&categorySlug=apparel&page=${page}&perPage=40`, {
            return fetch(`https://unicorngo.ru/api/catalog/product?sizeType=EU&sort=${sort}&fit=${ga}&fit=UNISEX&priceFrom=${pa}&priceTo=${pb}&categorySlug=apparel&page=${page}&perPage=40`, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7,zh-CN;q=0.6,zh;q=0.5",
                    "baggage": "sentry-environment=vercel-production,sentry-release=886df0d005081d9d4a00af8cbbd44162d4ae99de,sentry-public_key=8df192a0bb4eb5268bff2576d9a1ffee,sentry-trace_id=29efec2405994cfc8a73777aff813a15,sentry-sample_rate=1,sentry-sampled=true",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "sentry-trace": "29efec2405994cfc8a73777aff813a15-9978f6a8db334637-1"
                },
                "referrer": `https://unicorngo.ru/${gb}/apparel&gender=${gc}&page=1&perPage=40&priceFrom=${pa}&priceTo=${pb}&sizeType=EU&sizeValue=${sizeValue}&sort=${sort}`,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            })
    }
}
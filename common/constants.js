export const PRODUCT_STATUS = {
    CREATED: 'created',
    APPROVED: 'approved',
    APPROVED_WITH_CHANGES: 'approved_with_changes',
    PAYMENT_CHECK: 'payment_check',
    PAID: 'paid',
    CANCELED: 'canceled',
}

export const PRODUCT_DELIVERY_STATUS = {
    CREATED: 'created',
    PROCESSING: 'processing',
    POIZON_BOUGHT: 'poizon_bought',
    DELIVERY_TO_CHI_DEL_STR: 'delivery_to_chi_del_str',
    SORT_CHI_DEL_STR: 'sort_chi_del_str',
    DELIVERY_TO_RU_DEL_STR: 'delivery_to_ru_del_str',
    ARRIVED_RU_DEL_STR: 'arrived_ru_del_str',
    DELIVERY_CONSUMER_PVZ: 'delivery_consumer_pvz',
    ARRIVED_CONSUMER_PVZ: 'arrived_consumer_pvz',
    RECEIVED: 'received',
}

export const COLOR_LIST = [
    { name: "Бежевый", color: "#d2b48c", hex: "d2b48c" },
    { name: "Белый", color: "#ffffff", hex: "ffffff" },
    { name: "Бирюзовый", color: "#40e0d0", hex: "40e0d0" },
    { name: "Бордовый", color: "#800020", hex: "800020" },
    { name: "Голубой", color: "#87ceeb", hex: "87ceeb" },
    { name: "Желтый", color: "#ffff00", hex: "ffff00" },
    { name: "Зеленый", color: "#00FF00", hex: "00FF00" },
    { name: "Золотой", color: "#FFD700", hex: "FFD700" },
    { name: "Коралловый", color: "#FF7F50", hex: "FF7F50" },
    { name: "Коричневый", color: "#964B00", hex: "964B00" },
    { name: "Серебряный", color: "linear-gradient(90deg, #C0C0C0, #D3D3D3)", hex: 'silver' },
    { name: "Красный", color: "#FF0000", hex: "FF0000" },
    { name: "Оранжевый", color: "#FFA500", hex: "FFA500" },
    { name: "Прозрачный", color: "#FFFFFF", hex: "FFFFFF" },
    { name: "Розовый", color: "#FFC0CB", hex: "FFC0CB" },
    { name: "Серый", color: "#808080", hex: "808080" },
    { name: "Мультиколор", color: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #8F00FF)", hex: "multi" },
    { name: "Синий", color: "#0000FF", hex: "0000FF" },
    { name: "Фиолетовый", color: "#7D3C98", hex: "7D3C98" },
    { name: "Фуксия", color: "#FF00FF", hex: "FF00FF" },
    { name: "Хаки", color: "#808000", hex: "808000" },
    { name: "Черный", color: "#000000", hex: "000000" }
];

export const APPAREL_SIZES = [
    '4XS',
    '3XS',
    '2XS',
    'XS',
    'S',
    'M',
    'L',
    'XL',
    '2XL',
    '3XL',
    '4XL',
]

export const APPAREL_SIZES_MATCHES = {
    '4XS': 'XXXXS',
    '3XS': 'XXXS',
    '2XS': 'XXS',
    '2XL': 'XXL',
    '3XL': 'XXXL',
    '4XL': 'XXXXL',
}
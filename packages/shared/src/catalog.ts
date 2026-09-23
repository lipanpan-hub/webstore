// 商品上架状态
export type ProductStatus = 'on' | 'off'

// 卡密售出状态：unsold 可售 / locked 下单锁定中 / sold 已售出
export type CardStatus = 'unsold' | 'locked' | 'sold'

// 商品分类
export interface Category {
  id: string
  name: string
  sort: number
}

// 商品
export interface Product {
  id: string
  categoryId: string
  name: string
  description: string
  detail: string
  price: number
  status: ProductStatus
}

// 卡密
export interface Card {
  id: string
  productId: string
  secret: string
  status: CardStatus
}

// 商品视图：附带库存（未售卡密数量）
export interface ProductView extends Product {
  stock: number
}

// 首页目录视图：分类下挂载上架商品
export interface CategoryWithProducts extends Category {
  products: ProductView[]
}

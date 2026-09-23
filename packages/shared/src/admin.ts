// 管理端：创建分类
export interface AdminCreateCategoryInput {
  name: string
  sort?: number
}

// 管理端：创建商品（默认下架）
export interface AdminCreateProductInput {
  categoryId: string
  name: string
  price: number
  description?: string
  detail?: string
}

// 管理端：为商品批量导入卡密
export interface AdminAddCardsInput {
  productId: string
  secrets: string[]
}

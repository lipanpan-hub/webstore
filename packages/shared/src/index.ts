export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

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

// 支付服务商类型
export type PaymentProvider = 'alipay' | 'wechat' | 'stripe'

// 支付方式（面向前端的公开视图，不含服务商敏感配置）
export interface PaymentMethod {
  id: string
  name: string
  provider: PaymentProvider
  enabled: boolean
  sort: number
}

// 支付方式详情（面向 CLI/后台，附带服务商配置，含敏感信息）
export interface PaymentMethodDetail extends PaymentMethod {
  config: Record<string, string>
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

// 订单状态：pending 待支付 / paid 已支付并发货 / expired 超时失效
export type OrderStatus = 'pending' | 'paid' | 'expired'

// 创建订单入参（前端购买表单提交）
export interface CreateOrderInput {
  productId: string
  quantity: number
  email: string
  orderPassword: string
  paymentId: string
}

// 创建订单结果：返回支付二维码内容与失效时间戳
export interface CreateOrderResult {
  orderId: string
  qrCode: string
  totalAmount: string
  expireAt: number
}

// 订单状态视图（前端轮询）：支付完成后附带卡密明文
export interface OrderStatusView {
  orderId: string
  status: OrderStatus
  cards?: string[]
}

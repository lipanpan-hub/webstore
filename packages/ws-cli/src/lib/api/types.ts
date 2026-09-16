// admin API 的本地类型定义。
// 说明: @webstore/shared 的 main 指向 TS 源码, 而 ws-cli 以 tsc -b + rootDir=src 独立构建,
// 直接引用会产生构建冲突; 因此在此维护 CLI 所需的最小类型集, 与 shared 保持字段同步。

// 统一响应包装
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 商品上架状态
export type ProductStatus = 'on' | 'off'

// 卡密售出状态: unsold 可售 / locked 下单锁定中 / sold 已售出
export type CardStatus = 'unsold' | 'locked' | 'sold'

// 订单状态: pending 待支付 / paid 已支付并发货 / expired 超时失效
export type OrderStatus = 'pending' | 'paid' | 'expired'

// 商品分类
export interface Category {
  id: string
  name: string
  sort: number
}

// 支付服务商类型
export type PaymentProvider = 'alipay' | 'wechat' | 'stripe' | 'creem' | 'epay'

// 支付方式详情(含服务商配置, 含敏感信息)
export interface PaymentMethodDetail {
  id: string
  name: string
  provider: PaymentProvider
  enabled: boolean
  sort: number
  config: Record<string, string>
}

// 验证码服务商类型
export type CaptchaProvider = 'aliyun' | 'geetest'

// 验证码配置(含服务商配置, 含敏感密钥)
export interface CaptchaSetting {
  id: string
  provider: CaptchaProvider
  config: Record<string, string>
  enabled: boolean
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

// 管理侧订单视图(剔除订单密码与访问令牌等敏感凭证)
export interface AdminOrderView {
  orderId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: string
  email: string
  status: OrderStatus
  provider: string
  createdAt: number
  paidAt?: number
}

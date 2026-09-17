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
export type PaymentProvider = 'alipay' | 'wechat' | 'stripe' | 'creem' | 'epay'

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

// 验证码服务商类型
export type CaptchaProvider = 'aliyun' | 'geetest'

// 验证码配置（面向 CLI/后台，附带服务商配置，含敏感密钥）
export interface CaptchaSetting {
  id: string
  provider: CaptchaProvider
  config: Record<string, string>
  enabled: boolean
  sort: number
}

// 面向前端的公开验证码配置：用于初始化验证码控件，仅含公开参数；无启用项时接口返回 null
export interface CaptchaConfigView {
  provider: CaptchaProvider
  params: Record<string, string>
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
  // 验证码校验参数：由前端验证码控件产生，交服务端向服务商二次校验；未启用验证码时可为空
  captcha?: Record<string, string>
}

// 支付交付形态：qrcode 前端渲染二维码扫码 / redirect 浏览器跳转收银台
export type PayMode = 'qrcode' | 'redirect'

// 创建订单结果：payPayload 依 payMode 解读（二维码内容或跳转 URL）
export interface CreateOrderResult {
  orderId: string
  // 访问令牌：查询订单状态与卡密的凭证，需随请求携带
  accessToken: string
  payMode: PayMode
  payPayload: string
  totalAmount: string
  expireAt: number
}

// 订单状态视图（前端轮询）：支付完成后附带卡密明文
export interface OrderStatusView {
  orderId: string
  status: OrderStatus
  cards?: string[]
}

// 订单查询入参（游客凭邮箱与订单密码查询历史订单）
export interface OrderQueryInput {
  email: string
  orderPassword: string
}

// 订单查询结果视图：一条订单的概要，已支付时附带卡密明文
export interface OrderRecordView {
  orderId: string
  productName: string
  quantity: number
  totalAmount: string
  status: OrderStatus
  createdAt: number
  cards?: string[]
}

// API Key 权限范围：形如 <资源>:<动作>，支持 <资源>:* 与 * 通配
export type ApiKeyScope = string

// 角色：一组 scope 的命名聚合，作为 RBAC 中主体与权限之间的间接层
export interface Role {
  id: string
  name: string
  description?: string
  scopes: ApiKeyScope[]
  createdAt: number
}

// 角色引用：仅携带辨识所需的最小字段，供 API Key 视图展示其绑定角色
export interface RoleRef {
  id: string
  name: string
}

// API Key 信息视图（面向 CLI 展示，不含明文与哈希）
export interface ApiKeyInfo {
  id: string
  name: string
  // key 前若干位明文，仅供辨识是哪一把 key
  prefix: string
  // 绑定的角色（权限来源）
  roles: RoleRef[]
  // 由所绑定角色解析出的有效权限并集，供 Guard 校验与展示
  scopes: ApiKeyScope[]
  enabled: boolean
  createdAt: number
  lastUsedAt?: number
}

// 新建 API Key 的结果：明文 key 仅在创建时返回这一次，之后无法找回
export interface ApiKeyCreated extends ApiKeyInfo {
  key: string
}

// 管理侧订单视图：面向站长的订单概要，剔除订单密码与访问令牌等敏感凭证
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

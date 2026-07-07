// 策略模式：抽象支付网关，屏蔽各服务商差异，新增渠道只需实现本接口
import type { PayMode } from '@webstore/shared'

// 支付状态：pending 待支付 / success 已支付 / closed 已关闭
export type PaymentState = 'pending' | 'success' | 'closed'

// 预下单入参
export interface PrecreateParams {
  outTradeNo: string // 商户订单号，本系统生成的唯一订单标识，用于对账与回调时反查订单
  productId: string // 数据库商品 ID，部分网关（如 Creem）需据此在其平台侧幂等映射商品
  totalAmount: string // 订单金额，单位为元的字符串（避免浮点精度问题）
  subject: string // 订单标题/商品描述，展示在收银台供用户确认
  notifyUrl: string // 支付结果异步回调地址，网关支付成功后主动通知
  returnUrl?: string // 同步跳回地址，跳转类支付（如支付宝网站支付）付款后浏览器返回此页
}

// 回调请求上下文：屏蔽 GET query 与 POST body 差异，供网关解析订单标识
export interface PaymentNotify {
  query: Record<string, string> // URL 查询参数，GET 类回调（如支付宝同步/异步通知）从此取值
  body: Record<string, any> // 请求体，POST 类回调（如表单或 JSON 推送）从此取值
  headers: Record<string, string> // 请求头，验签类回调（如 Creem）从此取签名头
  rawBody: string // 原始请求体文本，供 HMAC 验签按字节还原计算，为空时网关自行决定是否跳过验签
}

// 预下单结果：payload 依 mode 解读（二维码内容或跳转 URL），tradeNo 为后续查询所需的交易标识（各服务商自定，订单层不透明持久化）
export interface PrecreateResult {
  mode: PayMode // 支付方式，决定 payload 的解读方式（如二维码 qrcode / 跳转 redirect）
  payload: string // 支付载体：mode 为二维码时是二维码内容，为跳转时是收银台 URL
  tradeNo: string // 交易标识，各服务商自定义，用于后续主动查询交易状态
}

export interface PaymentGateway {
  // 预下单，返回支付二维码内容与查询用交易标识
  precreate(params: PrecreateParams): Promise<PrecreateResult>
  // 按预下单返回的 tradeNo 查询交易状态
  query(tradeNo: string): Promise<PaymentState>
  // 从回调请求中解析商户订单号（outTradeNo），无法识别或验签失败时返回 null；结果真伪由后续主动查询确认
  parseNotify(notify: PaymentNotify): Promise<string | null>
}

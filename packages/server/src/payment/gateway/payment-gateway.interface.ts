// 策略模式：抽象支付网关，屏蔽各服务商差异，新增渠道只需实现本接口

// 支付状态：pending 待支付 / success 已支付 / closed 已关闭
export type PaymentState = 'pending' | 'success' | 'closed'

// 预下单入参
export interface PrecreateParams {
  outTradeNo: string
  totalAmount: string
  subject: string
}

export interface PaymentGateway {
  // 预下单，返回可供前端渲染的支付二维码内容
  precreate(params: PrecreateParams): Promise<string>
  // 查询交易状态
  query(outTradeNo: string): Promise<PaymentState>
}

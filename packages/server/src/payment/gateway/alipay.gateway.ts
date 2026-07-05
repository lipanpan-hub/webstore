import { AlipaySdk } from 'alipay-sdk'
import type { PaymentGateway, PaymentState, PrecreateParams } from './payment-gateway.interface.js'

// 支付宝当面付（扫码支付）网关实现，基于 alipay-sdk v3 协议
export class AlipayGateway implements PaymentGateway {
  private readonly sdk: AlipaySdk

  constructor(config: Record<string, string>) {
    // 密钥工具默认生成 PKCS8，故默认 PKCS8；可通过 config.keyType / config.endpoint 覆盖
    this.sdk = new AlipaySdk({
      appId: config.appId,
      privateKey: config.privateKey,
      alipayPublicKey: config.alipayPublicKey,
      keyType: (config.keyType as 'PKCS1' | 'PKCS8') ?? 'PKCS8',
      endpoint: config.endpoint || 'https://openapi.alipay.com',
    })
  }

  async precreate(params: PrecreateParams): Promise<string> {
    const res = await this.sdk.curl('POST', '/v3/alipay/trade/precreate', {
      body: {
        out_trade_no: params.outTradeNo,
        total_amount: params.totalAmount,
        subject: params.subject,
      },
    })
    const qrCode: string | undefined = res.data?.qrCode ?? res.data?.qr_code
    if (!qrCode) throw new Error(`支付宝预下单失败: ${JSON.stringify(res.data)}`)
    return qrCode
  }

  async query(outTradeNo: string): Promise<PaymentState> {
    try {
      const res = await this.sdk.curl('POST', '/v3/alipay/trade/query', {
        body: { out_trade_no: outTradeNo },
      })
      const status: string | undefined = res.data?.tradeStatus ?? res.data?.trade_status
      if (status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED') return 'success'
      if (status === 'TRADE_CLOSED') return 'closed'
      return 'pending'
    } catch {
      // 交易未创建/查询异常时视为待支付，交由超时机制兜底
      return 'pending'
    }
  }
}

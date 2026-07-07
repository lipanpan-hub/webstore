import { AlipaySdk } from 'alipay-sdk'
import type {
  PaymentGateway,
  PaymentNotify,
  PaymentState,
  PrecreateParams,
  PrecreateResult,
} from './payment-gateway.interface.js'

// 支付宝产品：face2face 当面付（扫码）/ page 电脑网站支付 / wap 手机网站支付
type AlipayProduct = 'face2face' | 'page' | 'wap'

// 支付宝网关：按 config.product 以策略分支适配不同支付产品，屏蔽扫码与跳转差异
export class AlipayGateway implements PaymentGateway {
  private readonly sdk: AlipaySdk
  private readonly product: AlipayProduct

  constructor(config: Record<string, string>) {
    // 密钥工具默认生成 PKCS8，故默认 PKCS8；可通过 config.keyType / config.endpoint 覆盖
    this.sdk = new AlipaySdk({
      appId: config.appId,
      privateKey: config.privateKey,
      alipayPublicKey: config.alipayPublicKey,
      keyType: (config.keyType as 'PKCS1' | 'PKCS8') ?? 'PKCS8',
      endpoint: config.endpoint || 'https://openapi.alipay.com',
    })
    this.product = (config.product as AlipayProduct) || 'face2face'
  }

  async precreate(params: PrecreateParams): Promise<PrecreateResult> {
    // 当面付走预下单取二维码，网站支付走页面生成跳转链接
    return this.product === 'face2face'
      ? this.precreateFace2Face(params)
      : this.precreatePage(params)
  }

  //#region 各产品预下单
  private async precreateFace2Face(params: PrecreateParams): Promise<PrecreateResult> {
    const res = await this.sdk.curl('POST', '/v3/alipay/trade/precreate', {
      body: {
        out_trade_no: params.outTradeNo,
        total_amount: params.totalAmount,
        subject: params.subject,
        notify_url: params.notifyUrl,
      },
    })
    const qrCode: string | undefined = res.data?.qrCode ?? res.data?.qr_code
    if (!qrCode) throw new Error(`支付宝预下单失败: ${JSON.stringify(res.data)}`)
    // 支付宝按 out_trade_no 查询，故 tradeNo 直接复用商户订单号
    return { mode: 'qrcode', payload: qrCode, tradeNo: params.outTradeNo }
  }

  private precreatePage(params: PrecreateParams): PrecreateResult {
    // 电脑网站支付 page.pay / 手机网站支付 wap.pay，GET 模式返回浏览器跳转 URL
    const method = this.product === 'wap' ? 'alipay.trade.wap.pay' : 'alipay.trade.page.pay'
    const productCode = this.product === 'wap' ? 'QUICK_WAP_WAY' : 'FAST_INSTANT_TRADE_PAY'
    const url = this.sdk.pageExecute(method, 'GET', {
      notify_url: params.notifyUrl,
      return_url: params.returnUrl,
      bizContent: {
        out_trade_no: params.outTradeNo,
        total_amount: params.totalAmount,
        subject: params.subject,
        product_code: productCode,
      },
    })
    return { mode: 'redirect', payload: url, tradeNo: params.outTradeNo }
  }
  //#endregion

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

  async parseNotify(notify: PaymentNotify): Promise<string | null> {
    // 支付宝异步通知为 form 表单 POST，订单号取 out_trade_no
    return notify.body?.out_trade_no ?? notify.query?.out_trade_no ?? null
  }
}

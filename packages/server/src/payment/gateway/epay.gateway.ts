import { createHash } from 'node:crypto'
import type {
  PaymentGateway,
  PaymentNotify,
  PaymentState,
  PrecreateParams,
  PrecreateResult,
} from './payment-gateway.interface.js'

// 易支付（彩虹版聚合支付）网关：mapi.php 预下单取二维码，api.php 按商户订单号轮询状态
export class EpayGateway implements PaymentGateway {
  private readonly baseUrl: string
  private readonly pid: string
  private readonly key: string
  private readonly type: string

  constructor(config: Record<string, string>) {
    // 去除接口地址末尾斜杠，避免拼接出双斜杠
    this.baseUrl = (config.apiUrl || '').replace(/\/+$/, '')
    this.pid = config.pid
    this.key = config.key
    this.type = config.type || 'alipay'
  }

  async precreate(params: PrecreateParams): Promise<PrecreateResult> {
    const body: Record<string, string> = {
      pid: this.pid,
      type: this.type,
      out_trade_no: params.outTradeNo,
      notify_url: params.notifyUrl,
      return_url: params.returnUrl || params.notifyUrl,
      name: params.subject,
      money: params.totalAmount,
      clientip: '127.0.0.1',
    }
    body.sign = this.sign(body)
    body.sign_type = 'MD5'

    const data = await this.request('POST', '/mapi.php', body)
    if (data.code !== 1) throw new Error(`易支付预下单失败: ${JSON.stringify(data)}`)
    // qrcode 为二维码内容，payurl 为跳转链接，优先取二维码供前端渲染
    const qrCode: string | undefined = data.qrcode || data.payurl || data.img
    if (!qrCode) throw new Error(`易支付未返回支付信息: ${JSON.stringify(data)}`)
    // 易支付支持按 out_trade_no 查询，故 tradeNo 复用商户订单号
    return { mode: 'redirect', payload: qrCode, tradeNo: params.outTradeNo }
  }

  async query(outTradeNo: string): Promise<PaymentState> {
    try {
      const query = new URLSearchParams({
        act: 'order',
        pid: this.pid,
        key: this.key,
        out_trade_no: outTradeNo,
      })
      const data = await this.request('GET', `/api.php?${query.toString()}`)
      // status=1 表示已支付
      if (data.code === 1 && data.status === 1) return 'success'
      return 'pending'
    } catch {
      // 查询异常视为待支付，交由订单超时机制兜底
      return 'pending'
    }
  }

  async parseNotify(notify: PaymentNotify): Promise<string | null> {
    // 易支付异步通知以 GET query 回调，订单号取 out_trade_no
    return notify.query?.out_trade_no ?? notify.body?.out_trade_no ?? null
  }

  // 签名：剔除空值与 sign/sign_type，按键名 ASCII 升序拼接后追加密钥取 MD5 小写
  private sign(params: Record<string, string>): string {
    const raw = Object.keys(params)
      .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== '')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&')
    return createHash('md5').update(raw + this.key).digest('hex')
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, string>,
  ): Promise<Record<string, any>> {
    const init: RequestInit = { method }
    if (method === 'POST' && body) {
      // 易支付 mapi.php 接收 form 表单编码
      init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
      init.body = new URLSearchParams(body).toString()
    }
    const res = await fetch(`${this.baseUrl}${path}`, init)
    const data = await res.json()
    if (!res.ok) throw new Error(`易支付接口错误 ${res.status}: ${JSON.stringify(data)}`)
    return data as Record<string, any>
  }
}

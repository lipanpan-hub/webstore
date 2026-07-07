import { Creem } from 'creem'
import { verifyWebhookSignature } from 'creem/webhooks'
import type {
  PaymentGateway,
  PaymentNotify,
  PaymentState,
  PrecreateParams,
  PrecreateResult,
} from './payment-gateway.interface.js'

// Creem 托管结账网关：基于官方 creem SDK，预下单创建 checkout 会话返回支付链接，按 checkout_id 查询状态
export class CreemGateway implements PaymentGateway {
  private readonly client: Creem
  // webhook 验签密钥，配置后回调需携带合法 creem-signature 方可通过
  private readonly webhookSecret: string

  constructor(config: Record<string, string>) {
    // 测试模式使用 sandbox 服务器，配置 testMode=true 时切换
    this.client = new Creem({
      apiKey: config.apiKey,
      server: config.testMode === 'true' ? 'test' : 'prod',
    })
    this.webhookSecret = config.webhookSecret ?? ''
  }

  async precreate(params: PrecreateParams): Promise<PrecreateResult> {
    // 以数据库商品 ID 幂等映射到 Creem 商品，避免站长手工维护 product_id
    const productId = await this.resolveProductId(params.productId, params.subject)
    // customPrice 以「分」为单位覆盖商品单价，实现按订单金额动态收款
    const checkout = await this.client.checkouts.create({
      productId,
      requestId: params.outTradeNo,
      customPrice: Math.round(Number(params.totalAmount) * 100),
      metadata: { subject: params.subject },
    })
    if (!checkout.checkoutUrl) {
      throw new Error(`Creem 预下单失败: ${JSON.stringify(checkout)}`)
    }
    // 前端直接跳转 checkoutUrl 进入 Creem 托管收银台
    return { mode: 'redirect', payload: checkout.checkoutUrl, tradeNo: checkout.id }
  }

  async query(tradeNo: string): Promise<PaymentState> {
    try {
      const checkout = await this.client.checkouts.retrieve(tradeNo)
      if (checkout.status === 'completed') return 'success'
      if (checkout.status === 'expired') return 'closed'
      return 'pending'
    } catch {
      // 查询异常视为待支付，交由订单超时机制兜底
      return 'pending'
    }
  }

  async parseNotify(notify: PaymentNotify): Promise<string | null> {
    // 配置了签名密钥则强制验签，验签失败直接判空拦截；未配置则跳过以兼容未启用验签的场景
    // SDK 同时兼容标准 svix 方案与旧版 creem-signature，并自动做时间戳防重放，验签失败时抛错
    if (this.webhookSecret) {
      try {
        await verifyWebhookSignature(notify.rawBody, notify.headers, this.webhookSecret)
      } catch {
        return null
      }
    }
    // Creem webhook 为 JSON POST，request_id 即下单时传入的商户订单号
    return notify.body?.object?.request_id ?? notify.body?.request_id ?? null
  }

  //#region Creem 商品幂等映射：数据库商品 ID 作为 Creem 商品 name
  private async resolveProductId(dbProductId: string, subject: string): Promise<string> {
    // 命中已存在的 Creem 商品则复用，否则以数据库商品 ID 为 name 创建后使用
    const existed = await this.findProductByName(dbProductId)
    if (existed) return existed
    // price 仅为占位（Creem 要求最低 100 分），实际收款由 checkout 的 customPrice 覆盖
    const created = await this.client.products.create({
      name: dbProductId,
      description: subject,
      price: 100,
      currency: 'USD',
      billingType: 'onetime',
    })
    return created.id
  }

  private async findProductByName(name: string): Promise<string | null> {
    // SDK 分页迭代器自动翻页，按 name 精确匹配数据库商品 ID
    const pages = await this.client.products.search(undefined, 100)
    for await (const page of pages) {
      const hit = page.result.items.find((product) => product.name === name)
      if (hit) return hit.id
    }
    return null
  }
  //#endregion
}

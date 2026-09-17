import {createHash, createHmac, randomUUID} from 'node:crypto'

import type {
  AdminOrderView,
  ApiResponse,
  Card,
  CardStatus,
  CaptchaProvider,
  CaptchaSetting,
  Category,
  PaymentMethodDetail,
  PaymentProvider,
  Product,
  ProductStatus,
} from './types.js'

// 新建商品入参
export interface CreateProductInput {
  categoryId: string
  name: string
  price: number
  description?: string
}

// 新建支付方式入参
export interface CreatePaymentInput {
  name: string
  provider: PaymentProvider
  config: Record<string, string>
  sort?: number
}

// 更新支付方式入参
export interface UpdatePaymentInput {
  name?: string
  sort?: number
  enabled?: boolean
  config?: Record<string, string>
}

// 新建验证码配置入参
export interface CreateCaptchaInput {
  provider: CaptchaProvider
  config: Record<string, string>
  sort?: number
}

// 更新验证码配置入参
export interface UpdateCaptchaInput {
  sort?: number
  enabled?: boolean
  config?: Record<string, string>
}

/**
 * admin HTTP API 客户端(门面模式)。
 *
 * 集中封装 baseUrl 拼接、keyId/secret 的 HMAC 签名鉴权头、统一 ApiResponse 解包与错误转换,
 * 命令层只面对 listProducts / createCategory 等业务语义方法, 不感知 HTTP 细节。
 */
export class AdminApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly keyId: string,
    private readonly secret: string,
  ) {}

  // #region 分类
  listCategories(): Promise<Category[]> {
    return this.request<Category[]>('GET', '/admin/categories')
  }

  createCategory(name: string, sort?: number): Promise<Category> {
    return this.request<Category>('POST', '/admin/categories', {name, sort})
  }
  // #endregion

  // #region 商品
  listProducts(): Promise<Product[]> {
    return this.request<Product[]>('GET', '/admin/products')
  }

  createProduct(input: CreateProductInput): Promise<Product> {
    return this.request<Product>('POST', '/admin/products', input)
  }

  setProductShelf(id: string, status: ProductStatus): Promise<Product> {
    return this.request<Product>('PATCH', `/admin/products/${encodeURIComponent(id)}/shelf`, {status})
  }

  setProductDetail(id: string, detail: string): Promise<Product> {
    return this.request<Product>('PATCH', `/admin/products/${encodeURIComponent(id)}/detail`, {detail})
  }
  // #endregion

  // #region 卡密
  listCards(productId: string): Promise<Card[]> {
    const query = `?productId=${encodeURIComponent(productId)}`
    return this.request<Card[]>('GET', `/admin/cards${query}`)
  }

  getCardStock(productId: string): Promise<number> {
    const query = `?productId=${encodeURIComponent(productId)}`
    return this.request<{stock: number}>('GET', `/admin/cards/stock${query}`).then((r) => r.stock)
  }

  importCards(productId: string, secrets: string[]): Promise<number> {
    return this
      .request<{imported: number}>('POST', '/admin/cards', {productId, secrets})
      .then((r) => r.imported)
  }

  deleteCard(id: string): Promise<boolean> {
    return this
      .request<{deleted: boolean}>('DELETE', `/admin/cards/${encodeURIComponent(id)}`)
      .then((r) => r.deleted)
  }

  clearCards(productId: string, status?: CardStatus): Promise<number> {
    return this
      .request<{deleted: number}>('POST', '/admin/cards/clear', {productId, status})
      .then((r) => r.deleted)
  }
  // #endregion

  // #region 支付方式
  listPayments(): Promise<PaymentMethodDetail[]> {
    return this.request<PaymentMethodDetail[]>('GET', '/admin/payments')
  }

  createPayment(input: CreatePaymentInput): Promise<PaymentMethodDetail> {
    return this.request<PaymentMethodDetail>('POST', '/admin/payments', input)
  }

  updatePayment(id: string, changes: UpdatePaymentInput): Promise<PaymentMethodDetail> {
    return this.request<PaymentMethodDetail>(
      'PATCH',
      `/admin/payments/${encodeURIComponent(id)}`,
      changes,
    )
  }

  deletePayment(id: string): Promise<null> {
    return this.request<null>('DELETE', `/admin/payments/${encodeURIComponent(id)}`)
  }
  // #endregion

  // #region 验证码
  listCaptchas(): Promise<CaptchaSetting[]> {
    return this.request<CaptchaSetting[]>('GET', '/admin/captchas')
  }

  createCaptcha(input: CreateCaptchaInput): Promise<CaptchaSetting> {
    return this.request<CaptchaSetting>('POST', '/admin/captchas', input)
  }

  updateCaptcha(id: string, changes: UpdateCaptchaInput): Promise<CaptchaSetting> {
    return this.request<CaptchaSetting>(
      'PATCH',
      `/admin/captchas/${encodeURIComponent(id)}`,
      changes,
    )
  }

  deleteCaptcha(id: string): Promise<null> {
    return this.request<null>('DELETE', `/admin/captchas/${encodeURIComponent(id)}`)
  }
  // #endregion

  // #region 订单
  listOrders(): Promise<AdminOrderView[]> {
    return this.request<AdminOrderView[]>('GET', '/admin/orders')
  }

  getOrder(id: string): Promise<AdminOrderView> {
    return this.request<AdminOrderView>('GET', `/admin/orders/${encodeURIComponent(id)}`)
  }
  // #endregion

  // #region HMAC 签名
  // 按服务端 HMAC 签名协议组装鉴权头; 协议权威定义见 server 的 api-key.signature.ts,
  // 修改两端时必须同步, 否则验签失败
  private buildSignedHeaders(method: string, path: string, rawBody: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = randomUUID()
    // 先对实际发送的原始请求体字节求 sha256, 再按固定顺序拼接待签名字符串
    const bodyHash = createHash('sha256').update(rawBody).digest('hex')
    const canonicalString = [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n')
    const signature = createHmac('sha256', this.secret).update(canonicalString).digest('hex')

    return {
      'x-api-key-id': this.keyId,
      'x-api-timestamp': timestamp,
      'x-api-nonce': nonce,
      'x-api-signature': signature,
    }
  }
  // #endregion

  // 统一请求出口: 拼接 URL、携带签名鉴权头、解包 ApiResponse, 非 2xx 时抛出带服务端信息的错误
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}${path}`
    // 无体请求按空串处理, 与服务端 rawBody ?? '' 的约定保持一致
    const rawBody = (body === undefined) ? '' : JSON.stringify(body)
    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers: {'content-type': 'application/json', ...this.buildSignedHeaders(method, path, rawBody)},
        body: (rawBody === '') ? undefined : rawBody,
      })
    } catch (error) {
      // 网络层失败(DNS / 拒连 / 超时), 附上目标地址便于排查
      throw new Error(`无法连接服务端 ${url}: ${(error as Error).message}`)
    }

    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null
    if (!response.ok) {
      const message = payload?.message ?? `HTTP ${response.status}`
      throw new Error(`[${response.status}] ${message}`)
    }
    if (!payload) throw new Error('服务端响应不是合法的 JSON')

    return payload.data
  }
}

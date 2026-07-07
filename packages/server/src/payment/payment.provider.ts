import type { PaymentProvider } from '@webstore/shared'

// 策略模式：集中定义各支付服务商的配置字段，新增服务商只需扩展此注册表

// 服务商配置字段定义
export interface ProviderConfigField {
  key: string
  label: string
  secret?: boolean // 敏感字段，展示时打码
  options?: { title: string; value: string }[] // 有则为枚举字段，录入时改用选择
}

// 服务商定义
export interface ProviderDef {
  provider: PaymentProvider
  label: string
  fields: ProviderConfigField[]
}

export const PAYMENT_PROVIDERS: ProviderDef[] = [
  {
    provider: 'alipay',
    label: '支付宝',
    fields: [
      {
        key: 'product',
        label: '支付产品',
        options: [
          { title: '当面付（扫码）', value: 'face2face' },
          { title: '电脑网站支付', value: 'page' },
          { title: '手机网站支付', value: 'wap' },
        ],
      },
      { key: 'appId', label: '应用 AppId' },
      { key: 'privateKey', label: '应用私钥', secret: true },
      { key: 'alipayPublicKey', label: '支付宝公钥', secret: true },
    ],
  },
  {
    provider: 'wechat',
    label: '微信支付',
    fields: [
      { key: 'appId', label: '应用 AppId' },
      { key: 'mchId', label: '商户号' },
      { key: 'apiV3Key', label: 'APIv3 密钥', secret: true },
      { key: 'serialNo', label: '证书序列号' },
      { key: 'privateKey', label: '商户私钥', secret: true },
    ],
  },
  {
    provider: 'stripe',
    label: 'Stripe',
    fields: [
      { key: 'secretKey', label: 'Secret Key', secret: true },
      { key: 'publishableKey', label: 'Publishable Key' },
      { key: 'webhookSecret', label: 'Webhook 签名密钥', secret: true },
    ],
  },
  {
    provider: 'creem',
    label: 'Creem',
    fields: [
      { key: 'apiKey', label: 'API Key', secret: true },
      { key: 'webhookSecret', label: 'Webhook 签名密钥', secret: true },
      { key: 'testMode', label: '测试模式 (true/false)' },
    ],
  },
  {
    provider: 'epay',
    label: '易支付',
    fields: [
      { key: 'apiUrl', label: '接口地址 (如 https://pay.xxx.com)' },
      { key: 'pid', label: '商户 ID' },
      { key: 'key', label: '商户密钥', secret: true },
      { key: 'type', label: '支付类型 (alipay/wxpay，默认 alipay)' },
    ],
  },
]

export function getProviderDef(provider: string): ProviderDef {
  const def = PAYMENT_PROVIDERS.find((p) => p.provider === provider)
  if (!def) throw new Error(`未知支付服务商: ${provider}`)
  return def
}

// 敏感值打码：仅保留首尾各 2 字符
export function maskSecret(value: string): string {
  if (!value) return '(未配置)'
  if (value.length <= 6) return '****'
  return `${value.slice(0, 2)}****${value.slice(-2)}`
}

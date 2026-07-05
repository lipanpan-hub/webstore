import type { PaymentProvider } from '@webstore/shared'

// 策略模式：集中定义各支付服务商的配置字段，新增服务商只需扩展此注册表

// 服务商配置字段定义
export interface ProviderConfigField {
  key: string
  label: string
  secret?: boolean // 敏感字段，展示时打码
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

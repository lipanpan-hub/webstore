import type {CaptchaProvider, PaymentProvider} from './api/index.js'
import {askOptionalText, askSelect} from './interactive.js'

// 支付 / 验证码服务商的配置字段注册表(注册表模式)。
// 字段元数据属于展示与录入契约, admin HTTP API 未暴露, 因此从服务端的
// payment.provider.ts / captcha.provider.ts 同步至此; 服务端新增服务商时需同步本文件。

// 服务商配置字段定义
export interface ProviderConfigField {
  key: string
  label: string
  secret?: boolean // 敏感字段, 展示时打码
  options?: {title: string; value: string}[] // 有则为枚举字段, 录入时改用选择
  defaultValue?: string // 缺省值, 录入时作为初始值
}

// 支付服务商定义
export interface PaymentProviderDef {
  provider: PaymentProvider
  label: string
  fields: ProviderConfigField[]
}

// 验证码服务商定义
export interface CaptchaProviderDef {
  provider: CaptchaProvider
  label: string
  fields: ProviderConfigField[]
}

export const PAYMENT_PROVIDERS: PaymentProviderDef[] = [
  {
    provider: 'alipay',
    label: '支付宝',
    fields: [
      {
        key: 'product',
        label: '支付产品',
        options: [
          {title: '当面付（扫码）', value: 'face2face'},
          {title: '电脑网站支付', value: 'page'},
          {title: '手机网站支付', value: 'wap'},
        ],
      },
      {key: 'appId', label: '应用 AppId'},
      {key: 'privateKey', label: '应用私钥', secret: true},
      {key: 'alipayPublicKey', label: '支付宝公钥', secret: true},
    ],
  },
  {
    provider: 'wechat',
    label: '微信支付',
    fields: [
      {key: 'appId', label: '应用 AppId'},
      {key: 'mchId', label: '商户号'},
      {key: 'apiV3Key', label: 'APIv3 密钥', secret: true},
      {key: 'serialNo', label: '证书序列号'},
      {key: 'privateKey', label: '商户私钥', secret: true},
    ],
  },
  {
    provider: 'stripe',
    label: 'Stripe',
    fields: [
      {key: 'secretKey', label: 'Secret Key', secret: true},
      {key: 'publishableKey', label: 'Publishable Key'},
      {key: 'webhookSecret', label: 'Webhook 签名密钥', secret: true},
    ],
  },
  {
    provider: 'creem',
    label: 'Creem',
    fields: [
      {key: 'apiKey', label: 'API Key', secret: true},
      {key: 'webhookSecret', label: 'Webhook 签名密钥', secret: true},
      {key: 'testMode', label: '测试模式 (true/false)'},
    ],
  },
  {
    provider: 'epay',
    label: '易支付',
    fields: [
      {key: 'apiUrl', label: '接口地址 (如 https://pay.xxx.com)'},
      {key: 'pid', label: '商户 ID'},
      {key: 'key', label: '商户密钥', secret: true},
      {key: 'type', label: '支付类型 (alipay/wxpay，默认 alipay)'},
    ],
  },
]

export const CAPTCHA_PROVIDERS: CaptchaProviderDef[] = [
  {
    provider: 'aliyun',
    label: '阿里云验证码2.0',
    fields: [
      {key: 'accessKeyId', label: 'AccessKey ID', secret: true},
      {key: 'accessKeySecret', label: 'AccessKey Secret', secret: true},
      {key: 'sceneId', label: '场景 ID (SceneId)'},
      {key: 'prefix', label: '身份标 (prefix)'},
      {key: 'region', label: '地域 (cn/sgp)', defaultValue: 'cn'},
    ],
  },
  {
    provider: 'geetest',
    label: '极验行为验证4代',
    fields: [
      {key: 'captchaId', label: '验证 ID (captcha_id)'},
      {key: 'captchaKey', label: '验证私钥 (captcha_key)', secret: true},
    ],
  },
]

export function getPaymentProviderDef(provider: string): PaymentProviderDef {
  const def = PAYMENT_PROVIDERS.find((p) => p.provider === provider)
  if (!def) throw new Error(`未知支付服务商: ${provider}`)
  return def
}

export function getCaptchaProviderDef(provider: string): CaptchaProviderDef {
  const def = CAPTCHA_PROVIDERS.find((p) => p.provider === provider)
  if (!def) throw new Error(`未知验证码服务商: ${provider}`)
  return def
}

// 敏感值打码: 仅保留首尾各 2 字符
export function maskSecret(value: string): string {
  if (!value) return '(未配置)'
  if (value.length <= 6) return '****'
  return `${value.slice(0, 2)}****${value.slice(-2)}`
}

// 逐项交互式录入某服务商的配置, current 提供更新时的初始值
export async function promptProviderConfig(
  fields: ProviderConfigField[],
  current: Record<string, string> = {},
): Promise<Record<string, string>> {
  const config: Record<string, string> = {}
  for (const field of fields) {
    if (field.options) {
      config[field.key] = await askSelect(field.label, field.options)
      continue
    }
    const label = field.secret ? `${field.label}（敏感）` : field.label
    config[field.key] = await askOptionalText(label, current[field.key] ?? field.defaultValue)
  }
  return config
}

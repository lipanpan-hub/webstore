import type { CaptchaProvider } from '@webstore/shared'

// 注册表模式：集中定义各验证码服务商的配置字段，新增服务商只需扩展此注册表

// 服务商配置字段定义
export interface ProviderConfigField {
  key: string
  label: string
  secret?: boolean // 敏感字段，展示时打码
  isPublic?: boolean // 前端控件初始化所需的公开字段，会下发给浏览器
  defaultValue?: string // 缺省值，录入时作为初始值
}

// 服务商定义
export interface CaptchaProviderDef {
  provider: CaptchaProvider
  label: string
  fields: ProviderConfigField[]
}

export const CAPTCHA_PROVIDERS: CaptchaProviderDef[] = [
  {
    provider: 'aliyun',
    label: '阿里云验证码2.0',
    fields: [
      { key: 'accessKeyId', label: 'AccessKey ID', secret: true },
      { key: 'accessKeySecret', label: 'AccessKey Secret', secret: true },
      { key: 'sceneId', label: '场景 ID (SceneId)', isPublic: true },
      { key: 'prefix', label: '身份标 (prefix)', isPublic: true },
      { key: 'region', label: '地域 (cn/sgp)', isPublic: true, defaultValue: 'cn' },
    ],
  },
  {
    provider: 'geetest',
    label: '极验行为验证4代',
    fields: [
      { key: 'captchaId', label: '验证 ID (captcha_id)', isPublic: true },
      { key: 'captchaKey', label: '验证私钥 (captcha_key)', secret: true },
    ],
  },
]

export function getCaptchaProviderDef(provider: string): CaptchaProviderDef {
  const def = CAPTCHA_PROVIDERS.find((p) => p.provider === provider)
  if (!def) throw new Error(`未知验证码服务商: ${provider}`)
  return def
}

// 提取下发给前端的公开参数（如场景 ID、身份标），过滤掉服务端密钥
export function pickPublicParams(
  provider: string,
  config: Record<string, string>,
): Record<string, string> {
  const params: Record<string, string> = {}
  for (const field of getCaptchaProviderDef(provider).fields) {
    if (field.isPublic) params[field.key] = config[field.key] ?? field.defaultValue ?? ''
  }
  return params
}

// 敏感值打码：仅保留首尾各 2 字符
export function maskSecret(value: string): string {
  if (!value) return '(未配置)'
  if (value.length <= 6) return '****'
  return `${value.slice(0, 2)}****${value.slice(-2)}`
}

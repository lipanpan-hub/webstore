// 验证码服务商类型
export type CaptchaProvider = 'aliyun' | 'geetest'

// 验证码配置（面向 CLI/后台，附带服务商配置，含敏感密钥）
export interface CaptchaSetting {
  id: string
  provider: CaptchaProvider
  config: Record<string, string>
  enabled: boolean
  sort: number
}

// 面向前端的公开验证码配置：用于初始化验证码控件，仅含公开参数；无启用项时接口返回 null
export interface CaptchaConfigView {
  provider: CaptchaProvider
  params: Record<string, string>
}

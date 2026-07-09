import CaptchaClientType, * as $Captcha from '@alicloud/captcha20230305'
import * as OpenApiCore from '@alicloud/openapi-core'
import type { CaptchaVerifier } from './captcha-verifier.interface.js'

// SDK 打包后真正的客户端类被多层包裹在 module.exports.default 中，运行时向下解出构造器
function resolveConstructor(mod: unknown): unknown {
  let current = mod as { default?: unknown }
  while (current && typeof current !== 'function') current = current.default as { default?: unknown }
  return current
}
const CaptchaClient = resolveConstructor($Captcha) as unknown as typeof CaptchaClientType

// 阿里云验证码2.0 服务端校验：调用 VerifyIntelligentCaptcha 接口做风险二次核验
export class AliyunVerifier implements CaptchaVerifier {
  private readonly client: CaptchaClientType
  private readonly sceneId: string

  constructor(config: Record<string, string>) {
    // 客户端 region 与服务端 endpoint 必须一致：cn→上海，sgp→新加坡
    const endpoint =
      config.region === 'sgp'
        ? 'captcha.ap-southeast-1.aliyuncs.com'
        : 'captcha.cn-shanghai.aliyuncs.com'
    const openApiConfig = new OpenApiCore.$OpenApiUtil.Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
    })
    openApiConfig.endpoint = endpoint
    openApiConfig.connectTimeout = 5000
    openApiConfig.readTimeout = 5000
    this.client = new CaptchaClient(openApiConfig)
    this.sceneId = config.sceneId
  }

  async verify(token: Record<string, string>): Promise<boolean> {
    const captchaVerifyParam = token.captchaVerifyParam
    if (!captchaVerifyParam) return false
    try {
      // 传入 sceneId 防止前端篡改场景
      const request = new $Captcha.VerifyIntelligentCaptchaRequest({
        sceneId: this.sceneId,
        captchaVerifyParam,
      })
      const resp = await this.client.verifyIntelligentCaptcha(request)
      // 结果判空：出现异常或空值时按通过处理，可用性优先
      return resp.body?.result?.verifyResult ?? true
    } catch {
      return true
    }
  }
}

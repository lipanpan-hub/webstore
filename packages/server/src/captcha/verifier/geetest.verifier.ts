import { createHmac } from 'node:crypto'
import type { CaptchaVerifier } from './captcha-verifier.interface.js'

const GEETEST_VALIDATE_API = 'https://gcaptcha4.geetest.com/validate'

// 极验行为验证4代 服务端二次校验：用私钥对流水号签名后回传极验核验用户验证有效性
export class GeetestVerifier implements CaptchaVerifier {
  private readonly captchaId: string
  private readonly captchaKey: string

  constructor(config: Record<string, string>) {
    this.captchaId = config.captchaId
    this.captchaKey = config.captchaKey
  }

  async verify(token: Record<string, string>): Promise<boolean> {
    // lot_number(验证流水号) captcha_output(验证输出信息) pass_token(验证通过标识) gen_time(验证通过时间戳)
    // 这四个字段由极验前端组件在用户验证成功后一并返回，是服务端二次核验的必要凭证
    // 任一字段缺失即说明前端未走完验证流程或参数被篡改/丢失，无需再请求极验直接判失败
    // lot_number:本次验证的流水号,用来做签名和让极验定位这次验证记录
    // captcha_output:验证输出信息  pass_token:验证通过标识  gen_time:验证通过的时间戳
    const { lot_number, captcha_output, pass_token, gen_time } = token
    if (!lot_number || !captcha_output || !pass_token || !gen_time) return false

    // 用私钥对流水号 lot_number 做 HMAC-SHA256 生成签名
    const signToken = createHmac('sha256', this.captchaKey).update(lot_number).digest('hex')
    const form = new URLSearchParams({
      lot_number,
      captcha_output,
      pass_token,
      gen_time,
      sign_token: signToken,
    })

    try {
      const res = await fetch(`${GEETEST_VALIDATE_API}?captcha_id=${this.captchaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      if (!res.ok) return true // 接口异常放行，可用性优先
      const data = (await res.json()) as { result?: string }
      return data.result === 'success'
    } catch {
      return true
    }
  }
}

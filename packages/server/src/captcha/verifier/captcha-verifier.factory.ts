import { Injectable } from '@nestjs/common'
import type { CaptchaSetting } from '@webstore/shared'
import type { CaptchaVerifier } from './captcha-verifier.interface.js'
import { AliyunVerifier } from './aliyun.verifier.js'
import { GeetestVerifier } from './geetest.verifier.js'

// 工厂模式：按验证码配置的服务商类型创建对应校验器策略实例
@Injectable()
export class CaptchaVerifierFactory {
  create(setting: CaptchaSetting): CaptchaVerifier {
    switch (setting.provider) {
      case 'aliyun':
        return new AliyunVerifier(setting.config)
      case 'geetest':
        return new GeetestVerifier(setting.config)
      default:
        throw new Error(`暂不支持的验证码服务商: ${setting.provider}`)
    }
  }
}

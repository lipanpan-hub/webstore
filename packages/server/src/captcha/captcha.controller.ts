import { Controller, Get } from '@nestjs/common'
import type { ApiResponse, CaptchaConfigView } from '@webstore/shared'
import { CaptchaService } from './captcha.service.js'

// 验证码控制器：为前端购买表单提供当前启用的验证码公开配置
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  async getConfig(): Promise<ApiResponse<CaptchaConfigView | null>> {
    // GET /captcha 返回启用中的验证码公开配置，无则 data 为 null（前端跳过验证码）
    const data = await this.captchaService.getPublicConfig()
    return { code: 200, message: 'ok', data }
  }
}

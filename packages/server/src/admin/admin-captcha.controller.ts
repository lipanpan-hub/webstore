import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import type { ApiResponse, CaptchaProvider, CaptchaSetting } from '@webstore/shared'
import { ApiKeyGuard } from '../apikey/api-key.guard.js'
import { RequireScopes } from '../apikey/require-scopes.decorator.js'
import { CaptchaService } from '../captcha/captcha.service.js'

interface CreateCaptchaBody {
  provider?: CaptchaProvider
  config?: Record<string, string>
  sort?: number
}

interface UpdateCaptchaBody {
  sort?: number
  enabled?: boolean
  config?: Record<string, string>
}

@Controller('admin/captchas')
@UseGuards(ApiKeyGuard)
export class AdminCaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @RequireScopes('captcha:read')
  async list(): Promise<ApiResponse<CaptchaSetting[]>> {
    const data = await this.captchaService.findAll()
    return { code: 200, message: 'ok', data }
  }

  @Post()
  @RequireScopes('captcha:create')
  async create(@Body() body: CreateCaptchaBody): Promise<ApiResponse<CaptchaSetting>> {
    if (!body.provider) throw new BadRequestException('缺少验证码服务商 provider')
    const data = await this.captchaService.create({
      provider: body.provider,
      config: body.config ?? {},
      sort: body.sort,
    })
    return { code: 200, message: 'ok', data }
  }

  @Patch(':id')
  @RequireScopes('captcha:update')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCaptchaBody,
  ): Promise<ApiResponse<CaptchaSetting>> {
    const data = await this.captchaService.update(id, body)
    return { code: 200, message: 'ok', data }
  }

  @Delete(':id')
  @RequireScopes('captcha:delete')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.captchaService.remove(id)
    return { code: 200, message: 'ok', data: null }
  }
}

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
import type { ApiResponse, PaymentMethodDetail, PaymentProvider } from '@webstore/shared'
import { ApiKeyGuard } from '../apikey/api-key.guard.js'
import { RequireScopes } from '../apikey/require-scopes.decorator.js'
import { PaymentService } from '../payment/payment.service.js'

interface CreatePaymentBody {
  name?: string
  provider?: PaymentProvider
  config?: Record<string, string>
  sort?: number
}

interface UpdatePaymentBody {
  name?: string
  sort?: number
  enabled?: boolean
  config?: Record<string, string>
}

@Controller('admin/payments')
@UseGuards(ApiKeyGuard)
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequireScopes('payment:read')
  async list(): Promise<ApiResponse<PaymentMethodDetail[]>> {
    const data = await this.paymentService.findAll()
    return { code: 200, message: 'ok', data }
  }

  @Post()
  @RequireScopes('payment:create')
  async create(@Body() body: CreatePaymentBody): Promise<ApiResponse<PaymentMethodDetail>> {
    if (!body.name?.trim()) throw new BadRequestException('支付方式名称不能为空')
    if (!body.provider) throw new BadRequestException('缺少支付服务商 provider')
    const data = await this.paymentService.create({
      name: body.name.trim(),
      provider: body.provider,
      config: body.config ?? {},
      sort: body.sort,
    })
    return { code: 200, message: 'ok', data }
  }

  @Patch(':id')
  @RequireScopes('payment:update')
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePaymentBody,
  ): Promise<ApiResponse<PaymentMethodDetail>> {
    const data = await this.paymentService.update(id, body)
    return { code: 200, message: 'ok', data }
  }

  @Delete(':id')
  @RequireScopes('payment:delete')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.paymentService.remove(id)
    return { code: 200, message: 'ok', data: null }
  }
}

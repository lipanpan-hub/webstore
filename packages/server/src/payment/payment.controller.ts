import { Controller, Get } from '@nestjs/common'
import type { ApiResponse, PaymentMethod } from '@webstore/shared'
import { PaymentService } from './payment.service.js'

// 支付方式控制器：为前端购买表单提供可选支付方式
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async getPayments(): Promise<ApiResponse<PaymentMethod[]>> {
    // GET /payments 返回启用中的支付方式
    const data = await this.paymentService.findEnabled()
    return { code: 200, message: 'ok', data }
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import type { AdminOrderView, ApiResponse } from '@webstore/shared'
import { ApiKeyGuard } from '../apikey/api-key.guard.js'
import { RequireScopes } from '../apikey/require-scopes.decorator.js'
import { OrderService } from '../order/order.service.js'

@Controller('admin/orders')
@UseGuards(ApiKeyGuard)
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @RequireScopes('order:read')
  async list(): Promise<ApiResponse<AdminOrderView[]>> {
    const data = await this.orderService.listForAdmin()
    return { code: 200, message: 'ok', data }
  }

  @Get(':id')
  @RequireScopes('order:read')
  async detail(@Param('id') id: string): Promise<ApiResponse<AdminOrderView>> {
    const data = await this.orderService.findByIdForAdmin(id)
    return { code: 200, message: 'ok', data }
  }
}

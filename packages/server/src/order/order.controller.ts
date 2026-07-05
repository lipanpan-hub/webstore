import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import type {
  ApiResponse,
  CreateOrderInput,
  CreateOrderResult,
  OrderStatusView,
} from '@webstore/shared'
import { OrderService } from './order.service.js'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() body: CreateOrderInput): Promise<ApiResponse<CreateOrderResult>> {
    // POST /orders 创建订单：校验、锁库存、发起支付，返回支付二维码
    const data = await this.orderService.createOrder(body)
    return { code: 200, message: 'ok', data }
  }

  @Get(':id/status')
  async status(@Param('id') id: string): Promise<ApiResponse<OrderStatusView>> {
    // GET /orders/:id/status 轮询订单支付状态，支付完成返回卡密
    const data = await this.orderService.getStatus(id)
    return { code: 200, message: 'ok', data }
  }
}

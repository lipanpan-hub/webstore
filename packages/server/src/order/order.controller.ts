import { All, Body, Controller, Get, Param, Post, Query, Req, Logger } from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import type {
  ApiResponse,
  CreateOrderInput,
  CreateOrderResult,
  OrderStatusView,
  OrderQueryInput,
  OrderRecordView,
} from '@webstore/shared'
import { OrderService } from './order.service.js'
import { PaymentService } from '../payment/payment.service.js'
import { PaymentGatewayFactory } from '../payment/gateway/payment-gateway.factory.js'

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name)

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

  @Post()
  async create(@Body() body: CreateOrderInput): Promise<ApiResponse<CreateOrderResult>> {
    // POST /orders 创建订单：校验、锁库存、发起支付，返回支付二维码
    this.logger.debug(`订单创建参数 ${JSON.stringify(body,null,2)}`)
    const data = await this.orderService.createOrder(body)
    return { code: 200, message: 'ok', data }
  }

  @Get(':id/status')
  async status(
    @Param('id') id: string,
    @Query('token') token: string,
  ): Promise<ApiResponse<OrderStatusView>> {
    // GET /orders/:id/status?token= 前端轮询订单支付状态，需携带访问令牌才能轮询这个接口，支付完成返回卡密
    const data = await this.orderService.getStatus(id, token)
    return { code: 200, message: 'ok', data }
  }

  @Post('query')
  async query(@Body() body: OrderQueryInput): Promise<ApiResponse<OrderRecordView[]>> {
    // POST /orders/query 凭邮箱与订单密码查询历史订单及卡密
    const data = await this.orderService.queryByEmail(body)
    return { code: 200, message: 'ok', data }
  }

  @All('notify/:paymentId')
  async notify(
    @Param('paymentId') paymentId: string, // 路径参数，支付记录 ID，用于反查支付方式
    @Query() query: Record<string, string>, // URL 查询参数，GET 回调的数据载体
    @Body() body: Record<string, any>, // 请求体，POST 回调的数据载体
    @Req() req: RawBodyRequest<{ headers: Record<string, string> }>, // 原始请求，取 headers 与 rawBody 供验签
  ): Promise<string> {
    // 支付网关异步回调（GET/POST 兼容）：解析订单号后触发即时确认，结果真伪由主动查询保证
    this.logger.debug(`收到支付回调 paymentId=${paymentId} query=${JSON.stringify(query)} body=${JSON.stringify(body)}`)
    try {
      const method = await this.paymentService.findDetailById(paymentId)
      const rawBody = req.rawBody?.toString('utf8') ?? ''
      const orderId = await this.gatewayFactory
        .create(method)
        .parseNotify({ query, body, headers: req.headers, rawBody })
      if (orderId) await this.orderService.confirmByNotify(orderId)
    } catch {
      // 回调异常不影响网关，交由前端轮询与超时兜底
    }
    // 多数网关约定收到 success 文本即停止重发
    return 'success'
  }
}

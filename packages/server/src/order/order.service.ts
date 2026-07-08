import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { createHash } from 'node:crypto'
import type { CreateOrderInput, CreateOrderResult, OrderStatusView } from '@webstore/shared'
import { OrderEntity, OrderDocument } from './order.schema.js'
import { ProductService } from '../product/product.service.js'
import { CardService } from '../card/card.service.js'
import { PaymentService } from '../payment/payment.service.js'
import { PaymentGatewayFactory } from '../payment/gateway/payment-gateway.factory.js'
import type { PrecreateResult } from '../payment/gateway/payment-gateway.interface.js'

// 订单有效期：5 分钟内未支付则失效
const ORDER_TTL_MS = 5 * 60 * 1000
// 定时兜底扫描间隔
const SWEEP_INTERVAL_MS = 30 * 1000

@Injectable()
export class OrderService implements OnModuleInit, OnModuleDestroy {
  private sweepTimer?: NodeJS.Timeout
  // 支付回调基础地址：网关支付成功后回调本服务的公网地址（经 .env 注入）
  private readonly paymentNotifyBaseUrl: string
  // 前端基础地址：跳转类支付付款后浏览器同步跳回此站点的商品页（经 .env 注入）
  private readonly webBaseUrl: string

  constructor(
    @InjectModel(OrderEntity.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productService: ProductService,
    private readonly cardService: CardService,
    private readonly paymentService: PaymentService,
    private readonly gatewayFactory: PaymentGatewayFactory,
    config: ConfigService,
  ) {
    this.paymentNotifyBaseUrl = config.get<string>('PAYMENT_NOTIFY_BASE_URL', 'http://localhost:3000')
    this.webBaseUrl = config.get<string>('WEB_BASE_URL', 'http://localhost:5173')
  }

  //#region 下单
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    this.validate(input)

    const product = await this.productService.findByIdWithStock(input.productId)
    if (product.status !== 'on') throw new BadRequestException('商品已下架')
    if (input.quantity > product.stock) {
      throw new BadRequestException(`库存不足，仅剩 ${product.stock} 件`)
    }

    const method = await this.paymentService.findDetailById(input.paymentId)
    if (!method.enabled) throw new BadRequestException('该支付方式不可用')

    // 预生成订单 ID 作为支付宝 out_trade_no，先锁库存再发起支付
    const orderId = new Types.ObjectId()
    const cardIds = await this.cardService.lockCards(
      input.productId,
      input.quantity,
      orderId.toString(),
    )
    const totalAmount = (product.price * input.quantity).toFixed(2)
    const expireAt = new Date(Date.now() + ORDER_TTL_MS)

    let payMode: PrecreateResult['mode']
    let payPayload: string
    let tradeNo: string
    try {
      const gateway = this.gatewayFactory.create(method)
      const result = await gateway.precreate({
        outTradeNo: orderId.toString(),
        productId: input.productId,
        totalAmount,
        subject: product.name,
        // 回调地址携带支付方式 ID，回调时据此选择对应网关解析通知
        notifyUrl: `${this.paymentNotifyBaseUrl}/orders/notify/${input.paymentId}`,
        // 跳转类支付付款后跳回商品页并携带 orderId，前端据此恢复轮询展示卡密
        returnUrl: `${this.webBaseUrl}/product/${input.productId}?orderId=${orderId.toString()}`,
      })
      payMode = result.mode
      payPayload = result.payload
      tradeNo = result.tradeNo
    } catch (e) {
      await this.cardService.releaseCards(cardIds)
      throw new BadRequestException(`发起支付失败: ${(e as Error).message}`)
    }

    await this.orderModel.create({
      _id: orderId,
      productId: input.productId,
      productName: product.name,
      unitPrice: product.price,
      quantity: input.quantity,
      totalAmount,
      email: input.email,
      orderPassword: this.hashPassword(input.orderPassword),
      paymentId: input.paymentId,
      provider: method.provider,
      cardIds,
      status: 'pending',
      payPayload,
      tradeNo,
      expireAt,
    })

    return { orderId: orderId.toString(), payMode, payPayload, totalAmount, expireAt: expireAt.getTime() }
  }

  private validate(input: CreateOrderInput): void {
    if (!input.productId) throw new BadRequestException('缺少商品信息')
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new BadRequestException('购买数量至少为 1')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new BadRequestException('邮箱格式不正确')
    }
    if (!input.orderPassword?.trim()) throw new BadRequestException('请设置订单密码')
    if (!input.paymentId) throw new BadRequestException('请选择支付方式')
  }
  //#endregion

  //#region 支付结果确认：回调优先，轮询兜底
  async confirmByNotify(orderId: string): Promise<void> {
    // 回调触发的即时确认（优先路径）：定位订单后主动向网关查询真实状态，成功即发货
    const order = await this.orderModel.findById(orderId)
    if (!order || order.status !== 'pending') return // 幂等操作：非待支付直接忽略 只有待支付的订单 才需要处理回调
    await this.confirmPending(order)
  }

  async getStatus(orderId: string): Promise<OrderStatusView> {
    // 前端轮询：作为回调丢失时的兜底，同样触发确认
    const order = await this.orderModel.findById(orderId)
    if (!order) throw new NotFoundException('订单不存在')

    if (order.status === 'pending') await this.confirmPending(order)

    const view: OrderStatusView = { orderId, status: order.status }
    if (order.status === 'paid') view.cards = await this.cardService.getSecrets(order.cardIds)
    return view
  }

  private async confirmPending(order: OrderDocument): Promise<void> {
    // 待支付订单的状态确认：过期即失效，否则以网关查询结果为准
    if (order.expireAt.getTime() < Date.now()) {
      // 如果订单过期时间小于当前时间说明订单已经过期超时 也就没有必要后续操作了 直接返回
      await this.expireOrder(order)
      return
    }
    const method = await this.paymentService.findDetailById(order.paymentId)
    // 调用 支付网关 对应的查询接口 主动从支付服务商哪里查询订单状态
    const state = await this.gatewayFactory.create(method).query(order.tradeNo ?? order.id)
    if (state === 'success') await this.fulfill(order)
    else if (state === 'closed') await this.expireOrder(order)
  }

  private async fulfill(order: OrderDocument): Promise<void> {
    // 支付成功：卡密置为已售，订单转已支付（自动发货）
    await this.cardService.markSold(order.cardIds)
    order.status = 'paid'
    order.paidAt = new Date()
    await order.save()
  }

  private async expireOrder(order: OrderDocument): Promise<void> {
    // 失效：释放锁定库存，订单转失效
    await this.cardService.releaseCards(order.cardIds)
    order.status = 'expired'
    await order.save()
  }
  //#endregion

  //#region 超时兜底：定时释放无人轮询的过期订单
  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      this.sweepExpired().catch(() => {})
    }, SWEEP_INTERVAL_MS)
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer)
  }

  private async sweepExpired(): Promise<void> {
    const expired = await this.orderModel.find({
      status: 'pending',
      expireAt: { $lt: new Date() },
    })
    for (const order of expired) await this.expireOrder(order)
  }
  //#endregion

  private hashPassword(raw: string): string {
    return createHash('sha256').update(raw).digest('hex')
  }
}

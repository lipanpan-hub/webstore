import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { createHash } from 'node:crypto'
import type { CreateOrderInput, CreateOrderResult, OrderStatusView } from '@webstore/shared'
import { OrderEntity, OrderDocument } from './order.schema.js'
import { ProductService } from '../product/product.service.js'
import { CardService } from '../card/card.service.js'
import { PaymentService } from '../payment/payment.service.js'
import { PaymentGatewayFactory } from '../payment/gateway/payment-gateway.factory.js'

// 订单有效期：2 分钟内未支付则失效
const ORDER_TTL_MS = 2 * 60 * 1000
// 定时兜底扫描间隔
const SWEEP_INTERVAL_MS = 30 * 1000

@Injectable()
export class OrderService implements OnModuleInit, OnModuleDestroy {
  private sweepTimer?: NodeJS.Timeout

  constructor(
    @InjectModel(OrderEntity.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productService: ProductService,
    private readonly cardService: CardService,
    private readonly paymentService: PaymentService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

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

    let qrCode: string
    try {
      const gateway = this.gatewayFactory.create(method)
      qrCode = await gateway.precreate({
        outTradeNo: orderId.toString(),
        totalAmount,
        subject: product.name,
      })
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
      qrCode,
      expireAt,
    })

    return { orderId: orderId.toString(), qrCode, totalAmount, expireAt: expireAt.getTime() }
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

  //#region 支付状态查询（前端轮询）
  async getStatus(orderId: string): Promise<OrderStatusView> {
    const order = await this.orderModel.findById(orderId)
    if (!order) throw new NotFoundException('订单不存在')

    if (order.status === 'pending') {
      if (order.expireAt.getTime() < Date.now()) {
        await this.expireOrder(order)
      } else {
        const method = await this.paymentService.findDetailById(order.paymentId)
        const state = await this.gatewayFactory.create(method).query(orderId)
        if (state === 'success') await this.fulfill(order)
        else if (state === 'closed') await this.expireOrder(order)
      }
    }

    const view: OrderStatusView = { orderId, status: order.status }
    if (order.status === 'paid') view.cards = await this.cardService.getSecrets(order.cardIds)
    return view
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

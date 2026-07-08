import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import type { OrderStatus } from '@webstore/shared'

export type OrderDocument = HydratedDocument<OrderEntity>

@Schema({ collection: 'orders', timestamps: true })
export class OrderEntity {
  @Prop({ required: true })
  productId!: string

  @Prop({ required: true })
  productName!: string

  @Prop({ required: true })
  unitPrice!: number

  @Prop({ required: true })
  quantity!: number

  @Prop({ required: true })
  totalAmount!: string

  @Prop({ required: true })
  email!: string

  @Prop({ required: true })
  orderPassword!: string

  // 访问令牌：查询订单状态与卡密的高熵凭证
  @Prop({ required: true })
  accessToken!: string

  @Prop({ required: true })
  paymentId!: string

  @Prop({ required: true })
  provider!: string

  @Prop({ type: [String], default: [] })
  cardIds!: string[]

  @Prop({ type: String, default: 'pending' })
  status!: OrderStatus

  @Prop()
  payPayload?: string

  @Prop()
  tradeNo?: string

  @Prop({ required: true })
  expireAt!: Date

  @Prop()
  paidAt?: Date

  // 由 timestamps 自动维护，此处仅声明类型供查询读取
  createdAt?: Date
}

export const OrderSchema = SchemaFactory.createForClass(OrderEntity)

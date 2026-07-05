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

  @Prop({ required: true })
  paymentId!: string

  @Prop({ required: true })
  provider!: string

  @Prop({ type: [String], default: [] })
  cardIds!: string[]

  @Prop({ type: String, default: 'pending' })
  status!: OrderStatus

  @Prop()
  qrCode?: string

  @Prop({ required: true })
  expireAt!: Date

  @Prop()
  paidAt?: Date
}

export const OrderSchema = SchemaFactory.createForClass(OrderEntity)

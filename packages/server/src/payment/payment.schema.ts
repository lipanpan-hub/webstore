import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type PaymentMethodDocument = HydratedDocument<PaymentMethodEntity>

@Schema({ collection: 'payment_methods' })
export class PaymentMethodEntity {
  @Prop({ required: true })
  name!: string

  @Prop({ required: true })
  provider!: string

  @Prop({ type: Object, default: {} })
  config!: Record<string, string>

  @Prop({ default: true })
  enabled!: boolean

  @Prop({ default: 0 })
  sort!: number
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethodEntity)

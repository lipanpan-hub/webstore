import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import type { CardStatus } from '@webstore/shared'

export type CardDocument = HydratedDocument<CardEntity>

@Schema({ collection: 'cards' })
export class CardEntity {
  @Prop({ required: true })
  productId!: string

  @Prop({ required: true })
  secret!: string

  @Prop({ type: String, default: 'unsold' })
  status!: CardStatus

  @Prop({ type: String, default: null })
  orderId!: string | null
}

export const CardSchema = SchemaFactory.createForClass(CardEntity)

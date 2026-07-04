import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import type { ProductStatus } from '@webstore/shared'

export type ProductDocument = HydratedDocument<ProductEntity>

@Schema({ collection: 'products' })
export class ProductEntity {
  @Prop({ required: true })
  categoryId!: string

  @Prop({ required: true })
  name!: string

  @Prop({ default: '' })
  description!: string

  @Prop({ required: true })
  price!: number

  @Prop({ type: String, default: 'off' })
  status!: ProductStatus
}

export const ProductSchema = SchemaFactory.createForClass(ProductEntity)

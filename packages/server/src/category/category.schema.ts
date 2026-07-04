import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type CategoryDocument = HydratedDocument<CategoryEntity>

@Schema({ collection: 'categories' })
export class CategoryEntity {
  @Prop({ required: true })
  name!: string

  @Prop({ default: 0 })
  sort!: number
}

export const CategorySchema = SchemaFactory.createForClass(CategoryEntity)

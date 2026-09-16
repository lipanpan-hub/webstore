import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ApiKeyDocument = HydratedDocument<ApiKeyEntity>

@Schema({ collection: 'api_keys', timestamps: true })
export class ApiKeyEntity {
  @Prop({ required: true })
  name!: string

  // 仅存 key 的 sha256 哈希，明文不落库；即便库泄露也无法还原 key
  @Prop({ required: true, unique: true })
  keyHash!: string

  // key 前若干位明文，仅供 list 时辨识是哪一把
  @Prop({ required: true })
  prefix!: string

  @Prop({ type: [String], default: [] })
  scopes!: string[]

  @Prop({ default: true })
  enabled!: boolean

  @Prop()
  lastUsedAt?: Date

  // 由 timestamps 自动维护，此处仅声明类型供查询读取
  createdAt?: Date
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyEntity)

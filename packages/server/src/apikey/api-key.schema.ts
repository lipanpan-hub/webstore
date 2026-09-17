import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ApiKeyDocument = HydratedDocument<ApiKeyEntity>

@Schema({ collection: 'api_keys', timestamps: true })
export class ApiKeyEntity {
  @Prop({ required: true })
  name!: string

  // 公开标识，客户端经 X-Api-Key-Id 头声明；服务端据此定位对应 secret
  @Prop({ required: true, unique: true })
  keyId!: string

  // HMAC 签名密钥的 AES-256-GCM 密文；明文只在创建时返回一次，不落库
  // 即便库泄露，缺少 .env 中的主密钥也无法解出 secret
  @Prop({ required: true })
  secretEnc!: string

  // 绑定的角色 id（权限来源），verify 时解析成有效 scope 并集
  @Prop({ type: [String], default: [] })
  roleIds!: string[]

  @Prop({ default: true })
  enabled!: boolean

  @Prop()
  lastUsedAt?: Date

  // 由 timestamps 自动维护，此处仅声明类型供查询读取
  createdAt?: Date
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyEntity)

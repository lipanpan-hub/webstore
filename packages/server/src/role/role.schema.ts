import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type RoleDocument = HydratedDocument<RoleEntity>

// 角色：一组 scope 的命名聚合，站长经 CLI 动态管理
@Schema({ collection: 'roles', timestamps: true })
export class RoleEntity {
  @Prop({ required: true, unique: true })
  name!: string

  @Prop({ default: '' })
  description!: string

  @Prop({ type: [String], default: [] })
  scopes!: string[]

  // 由 timestamps 自动维护，此处仅声明类型供查询读取
  createdAt?: Date
}

export const RoleSchema = SchemaFactory.createForClass(RoleEntity)

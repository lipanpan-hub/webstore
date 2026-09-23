import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import type { Permission } from '@webstore/shared'

export type RoleDocument = HydratedDocument<RoleEntity>

@Schema({ collection: 'roles' })
export class RoleEntity {
  // 角色名唯一，作为用户 roles 数组的引用键
  @Prop({ required: true, unique: true })
  name!: string

  @Prop({ default: '' })
  description!: string

  // 权限点集合（`资源:动作` 或通配 `*`）
  @Prop({ type: [String], default: [] })
  permissions!: Permission[]
}

export const RoleSchema = SchemaFactory.createForClass(RoleEntity)

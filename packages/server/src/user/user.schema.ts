import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import type { UserStatus } from '@webstore/shared'

export type UserDocument = HydratedDocument<UserEntity>

@Schema({ collection: 'users', timestamps: true })
export class UserEntity {
  @Prop({ required: true, unique: true })
  username!: string

  // 密码哈希（scrypt，格式 salt:hash），不对外返回
  @Prop({ required: true })
  passwordHash!: string

  // 角色名数组，引用 roles 集合的 name
  @Prop({ type: [String], default: [] })
  roles!: string[]

  @Prop({ type: String, default: 'active' })
  status!: UserStatus
}

export const UserSchema = SchemaFactory.createForClass(UserEntity)

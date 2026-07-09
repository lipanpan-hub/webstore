import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type CaptchaSettingDocument = HydratedDocument<CaptchaSettingEntity>

@Schema({ collection: 'captcha_settings' })
export class CaptchaSettingEntity {
  @Prop({ required: true })
  provider!: string

  @Prop({ type: Object, default: {} })
  config!: Record<string, string>

  @Prop({ default: true })
  enabled!: boolean

  @Prop({ default: 0 })
  sort!: number
}

export const CaptchaSettingSchema = SchemaFactory.createForClass(CaptchaSettingEntity)

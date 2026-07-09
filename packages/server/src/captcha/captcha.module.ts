import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CaptchaSettingEntity, CaptchaSettingSchema } from './captcha.schema.js'
import { CaptchaService } from './captcha.service.js'
import { CaptchaController } from './captcha.controller.js'
import { CaptchaVerifierFactory } from './verifier/captcha-verifier.factory.js'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CaptchaSettingEntity.name, schema: CaptchaSettingSchema },
    ]),
  ],
  controllers: [CaptchaController],
  providers: [CaptchaService, CaptchaVerifierFactory],
  exports: [CaptchaService],
})
export class CaptchaModule {}

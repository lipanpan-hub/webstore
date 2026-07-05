import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PaymentMethodEntity, PaymentMethodSchema } from './payment.schema.js'
import { PaymentService } from './payment.service.js'
import { PaymentController } from './payment.controller.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentMethodEntity.name, schema: PaymentMethodSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

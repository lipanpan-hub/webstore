import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PaymentMethodEntity, PaymentMethodSchema } from './payment.schema.js'
import { PaymentService } from './payment.service.js'
import { PaymentController } from './payment.controller.js'
import { PaymentGatewayFactory } from './gateway/payment-gateway.factory.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentMethodEntity.name, schema: PaymentMethodSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentGatewayFactory],
  exports: [PaymentService, PaymentGatewayFactory],
})
export class PaymentModule {}

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OrderEntity, OrderSchema } from './order.schema.js'
import { OrderService } from './order.service.js'
import { OrderController } from './order.controller.js'
import { ProductModule } from '../product/product.module.js'
import { CardModule } from '../card/card.module.js'
import { PaymentModule } from '../payment/payment.module.js'
import { CaptchaModule } from '../captcha/captcha.module.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrderEntity.name, schema: OrderSchema }]),
    ProductModule,
    CardModule,
    PaymentModule,
    CaptchaModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}

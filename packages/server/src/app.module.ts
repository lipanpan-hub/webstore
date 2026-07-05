import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { CategoryModule } from './category/category.module.js'
import { ProductModule } from './product/product.module.js'
import { CardModule } from './card/card.module.js'
import { CatalogModule } from './catalog/catalog.module.js'
import { PaymentModule } from './payment/payment.module.js'
import { OrderModule } from './order/order.module.js'

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/webstore'

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI),
    CategoryModule,
    ProductModule,
    CardModule,
    CatalogModule,
    PaymentModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}

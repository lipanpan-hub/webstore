import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { CategoryModule } from './category/category.module.js'
import { ProductModule } from './product/product.module.js'
import { CardModule } from './card/card.module.js'
import { CatalogModule } from './catalog/catalog.module.js'
import { PaymentModule } from './payment/payment.module.js'
import { CaptchaModule } from './captcha/captcha.module.js'
import { OrderModule } from './order/order.module.js'

@Module({
  imports: [
    // 全局加载 .env，各处统一经 ConfigService 读取
    ConfigModule.forRoot({ isGlobal: true }),
    // 异步注入以确保 ConfigModule 完成 .env 加载后再取连接地址
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI', 'mongodb://127.0.0.1:27017/webstore'),
      }),
    }),
    CategoryModule,
    ProductModule,
    CardModule,
    CatalogModule,
    PaymentModule,
    CaptchaModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { ApiKeyModule } from '../apikey/api-key.module.js'
import { CategoryModule } from '../category/category.module.js'
import { ProductModule } from '../product/product.module.js'
import { CardModule } from '../card/card.module.js'
import { PaymentModule } from '../payment/payment.module.js'
import { CaptchaModule } from '../captcha/captcha.module.js'
import { OrderModule } from '../order/order.module.js'
import { AdminCategoryController } from './admin-category.controller.js'
import { AdminProductController } from './admin-product.controller.js'
import { AdminCardController } from './admin-card.controller.js'
import { AdminPaymentController } from './admin-payment.controller.js'
import { AdminCaptchaController } from './admin-captcha.controller.js'
import { AdminOrderController } from './admin-order.controller.js'

@Module({
  // 导入 ApiKeyModule 以解析 ApiKeyGuard，导入各领域模块以复用其 Service
  imports: [
    ApiKeyModule,
    CategoryModule,
    ProductModule,
    CardModule,
    PaymentModule,
    CaptchaModule,
    OrderModule,
  ],
  controllers: [
    AdminCategoryController,
    AdminProductController,
    AdminCardController,
    AdminPaymentController,
    AdminCaptchaController,
    AdminOrderController,
  ],
})
export class AdminModule {}

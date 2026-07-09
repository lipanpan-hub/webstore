import { Module } from '@nestjs/common'
import { AppModule } from './app.module.js'
import { CategoryModule } from './category/category.module.js'
import { ProductModule } from './product/product.module.js'
import { CardModule } from './card/card.module.js'
import { PaymentModule } from './payment/payment.module.js'
import { CaptchaModule } from './captcha/captcha.module.js'
import { HelloCommand } from './commands/hello.command.js'
import { categoryCommandProviders } from './commands/category.command.js'
import { productCommandProviders } from './commands/product.command.js'
import { cardCommandProviders } from './commands/card.command.js'
import { paymentCommandProviders } from './commands/payment.command.js'
import { captchaCommandProviders } from './commands/captcha.command.js'

@Module({
  // 导入领域模块以复用其 Service，命令在 providers 注册即可
  imports: [AppModule, CategoryModule, ProductModule, CardModule, PaymentModule, CaptchaModule],
  providers: [
    HelloCommand,
    ...categoryCommandProviders,
    ...productCommandProviders,
    ...cardCommandProviders,
    ...paymentCommandProviders,
    ...captchaCommandProviders,
  ],
})
export class CliModule {}

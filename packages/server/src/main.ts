import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ApiExceptionFilter } from './common/api-exception.filter.js'

async function bootstrap() {
  // rawBody 保留原始请求体，供支付回调按字节还原做 HMAC 验签
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.enableCors()
  app.useGlobalFilters(new ApiExceptionFilter())
  await app.listen(3000)
  console.log('Server running on http://localhost:3000')
}

bootstrap()

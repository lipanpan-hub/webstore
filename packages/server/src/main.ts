import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ApiExceptionFilter } from './common/api-exception.filter.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.useGlobalFilters(new ApiExceptionFilter())
  await app.listen(3000)
  console.log('Server running on http://localhost:3000')
}

bootstrap()

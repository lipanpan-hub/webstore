import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { LogLevel } from '@nestjs/common'
import { AppModule } from './app.module.js'
import { ApiExceptionFilter } from './common/api-exception.filter.js'

async function bootstrap() {
  // rawBody 保留原始请求体，供支付回调按字节还原做 HMAC 验签
  // bufferLogs 先缓冲日志，待 ConfigService 读到 .env 后再确定输出等级
  const app = await NestFactory.create(AppModule, { rawBody: true, bufferLogs: true })

  // 从 .env 读取 LOG_LEVEL（逗号分隔），缺省仅输出 log/error/warn
  const config = app.get(ConfigService)
  const logLevels = config
    .get<string>('LOG_LEVEL', 'log,error,warn')
    .split(',')
    .map((level) => level.trim())
    .filter(Boolean) as LogLevel[]
  app.useLogger(logLevels)

  app.enableCors()
  app.useGlobalFilters(new ApiExceptionFilter())
  await app.listen(3000)
  console.log('Server running on http://localhost:3000')
}

bootstrap()

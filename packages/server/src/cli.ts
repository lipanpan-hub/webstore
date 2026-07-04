import { CommandFactory } from 'nest-commander'
import { CliModule } from './cli.module.js'

async function bootstrap() {
  // CLI 入口，与 main.ts 的 HTTP 入口并列，共享同一批领域 Service
  await CommandFactory.run(CliModule, ['warn', 'error'])
}

bootstrap()

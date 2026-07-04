import { Module } from '@nestjs/common'
import { AppModule } from './app.module.js'
import { HelloCommand } from './commands/hello.command.js'

@Module({
  // 导入领域模块以复用其 Service，新增命令在 providers 注册即可
  imports: [AppModule],
  providers: [HelloCommand],
})
export class CliModule {}

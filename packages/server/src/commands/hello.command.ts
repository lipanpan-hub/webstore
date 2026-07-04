import { Command, CommandRunner } from 'nest-commander'
import { AppService } from '../app.service.js'

@Command({ name: 'hello', description: '示例命令，验证 CLI 与 HTTP 共享同一套 Service 层' })
export class HelloCommand extends CommandRunner {
  constructor(private readonly appService: AppService) {
    super()
  }

  async run(): Promise<void> {
    // 直接复用后端 Service，证明 DI 容器与业务逻辑完全共享
    console.log(this.appService.getHello())
  }
}

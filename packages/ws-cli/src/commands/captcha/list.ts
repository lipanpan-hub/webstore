import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printCaptchaDetail} from '../../lib/display.js'

export default class CaptchaList extends AdminBaseCommand {
  static description = '列出所有验证码配置及参数'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.parse(CaptchaList)

    const list = await this.client.listCaptchas()
    for (const c of list) {
      printCaptchaDetail(c)
    }
  }
}

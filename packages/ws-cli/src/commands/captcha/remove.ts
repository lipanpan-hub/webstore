import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askConfirm} from '../../lib/interactive.js'
import {getCaptchaProviderDef} from '../../lib/providers.js'
import {pickCaptcha} from '../../lib/pickers.js'

export default class CaptchaRemove extends AdminBaseCommand {
  static description = '删除验证码配置（缺参时交互选择）'

  static examples = ['<%= config.bin %> <%= command.id %> -i <captchaId>']

  static flags = {
    id: Flags.string({char: 'i', description: '验证码配置 ID'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CaptchaRemove)

    // 传入 id 直接删除, 否则交互式选择
    const target = flags.id ? await this.pickById(flags.id) : await pickCaptcha(this.client)
    if (!(await askConfirm(`确认删除验证码配置 ${getCaptchaProviderDef(target.provider).label}?`))) {
      return
    }

    await this.client.deleteCaptcha(target.id)
    this.log(`已删除验证码配置: ${target.id}`)
  }

  // 按 id 拉取列表后精确匹配, 找不到时给出明确错误
  private async pickById(id: string): Promise<{id: string; provider: string}> {
    const list = await this.client.listCaptchas()
    const found = list.find((c) => c.id === id)
    if (!found) throw new Error(`验证码配置不存在: ${id}`)
    return found
  }
}

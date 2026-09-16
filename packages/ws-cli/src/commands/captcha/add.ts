import {Flags} from '@oclif/core'

import type {CaptchaProvider} from '../../lib/api/index.js'
import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printCaptchaDetail} from '../../lib/display.js'
import {askNumber, askSelect} from '../../lib/interactive.js'
import {CAPTCHA_PROVIDERS, getCaptchaProviderDef, promptProviderConfig} from '../../lib/providers.js'

export default class CaptchaAdd extends AdminBaseCommand {
  static description = '添加验证码配置（选择服务商并录入参数）'

  static examples = ['<%= config.bin %> <%= command.id %> -s 1']

  static flags = {
    sort: Flags.integer({char: 's', description: '排序权重(多个启用时数值小者优先)'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CaptchaAdd)

    // #region 交互采集: 服务商 → 配置 → 排序
    const provider = await askSelect<CaptchaProvider>(
      '选择验证码服务商',
      CAPTCHA_PROVIDERS.map((p) => ({title: p.label, value: p.provider})),
    )
    const config = await promptProviderConfig(getCaptchaProviderDef(provider).fields)
    const sort = flags.sort ?? (await askNumber('排序权重（多个启用时数值小者优先）'))
    // #endregion

    const setting = await this.client.createCaptcha({provider, config, sort})
    this.log('已添加验证码配置:')
    printCaptchaDetail(setting)
  }
}

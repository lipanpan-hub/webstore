import {Flags} from '@oclif/core'

import type {CaptchaSetting, UpdateCaptchaInput} from '../../lib/api/index.js'
import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printCaptchaDetail} from '../../lib/display.js'
import {askNumber, askSelect} from '../../lib/interactive.js'
import {getCaptchaProviderDef, promptProviderConfig} from '../../lib/providers.js'
import {pickCaptcha} from '../../lib/pickers.js'

export default class CaptchaUpdate extends AdminBaseCommand {
  static description = '更新验证码配置（缺参时交互询问）'

  static examples = [
    '<%= config.bin %> <%= command.id %> -i <captchaId> -e true',
    '<%= config.bin %> <%= command.id %> -i <captchaId> -s 2',
  ]

  static flags = {
    id: Flags.string({char: 'i', description: '验证码配置 ID'}),
    sort: Flags.integer({char: 's', description: '排序权重(多个启用时数值小者优先)'}),
    enabled: Flags.string({char: 'e', description: '是否启用 true|false'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CaptchaUpdate)

    // 传入 id 时按 id 精确查找, 否则交互式选择
    const target = flags.id ? await this.pickById(flags.id) : await pickCaptcha(this.client)

    // 命令行指定字段时只改这些字段; 否则进入交互补全(含服务商配置)
    const changes = this.hasFlag(flags) ? this.fromFlags(flags) : await this.fromPrompts(target)

    const setting = await this.client.updateCaptcha(target.id, changes)
    this.log('已更新验证码配置:')
    printCaptchaDetail(setting)
  }

  // 按 id 拉取列表后精确匹配, 找不到时给出明确错误
  private async pickById(id: string): Promise<CaptchaSetting> {
    const list = await this.client.listCaptchas()
    const found = list.find((c) => c.id === id)
    if (!found) throw new Error(`验证码配置不存在: ${id}`)
    return found
  }

  private hasFlag(flags: {enabled?: string; sort?: number;}): boolean {
    return flags.sort !== undefined || flags.enabled !== undefined
  }

  private fromFlags(flags: {enabled?: string; sort?: number;}): UpdateCaptchaInput {
    return {
      sort: flags.sort,
      enabled: flags.enabled !== undefined ? this.parseEnabled(flags.enabled) : undefined,
    }
  }

  // 校验启用状态取值
  private parseEnabled(raw: string): boolean {
    if (raw !== 'true' && raw !== 'false') throw new Error('enabled 只能为 true 或 false')
    return raw === 'true'
  }

  private async fromPrompts(
    target: CaptchaSetting,
  ): Promise<{config: Record<string, string>; enabled: boolean; sort: number;}> {
    const sort = await askNumber('排序权重（多个启用时数值小者优先）')
    const enabled = await askSelect<boolean>('状态', [
      {title: '启用', value: true},
      {title: '停用', value: false},
    ])
    const config = await promptProviderConfig(getCaptchaProviderDef(target.provider).fields, target.config)
    return {sort, enabled, config}
  }
}

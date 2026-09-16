// 这个命令的作用是 交互式 在 ws-cli配置文件的 current profile 当中添加 api key 和  base url 2个配置项的值

import * as inquirer from '@inquirer/prompts'

import {BaseCommand} from '../../lib/base-command.js'
import {ToolConfigManager} from '../../lib/config/index.js'

export default class ConfigSet extends BaseCommand {
  static aliases = ['cf:set']
  static description = '交互式设置当前配置档案的 API Key 与服务端地址(baseUrl)'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    const configManager = ToolConfigManager.fromConfigDir(this.config.configDir)

    // 保证配置文件与默认档案存在, 且已设为当前激活档案
    configManager.ensureConfig()

    const current = configManager.getCurrentProfile()
    if (!current) {
      this.error('未找到当前激活的配置档案, 请先用 `wsc config edit` 设置 current 档案')
    }

    // #region 交互采集 baseUrl 与 apiKey(以现有值作为默认, 直接回车即保留)
    const baseUrl = await inquirer.input({
      default: current.baseUrl,
      message: '请输入服务端地址 (baseUrl):',
      validate: (value) => (value.trim().length > 0 ? true : 'baseUrl 不能为空'),
    })

    const apiKey = await inquirer.input({
      default: current.apiKey,
      message: '请输入 API Key:',
      validate: (value) => (value.trim().length > 0 ? true : 'API Key 不能为空'),
    })
    // #endregion

    // 局部更新当前档案的两个字段并持久化
    configManager.updateCurrentProfile({apiKey: apiKey.trim(), baseUrl: baseUrl.trim()})

    this.log(`已更新档案 "${current.name}" 的 baseUrl 与 apiKey`)
  }
}

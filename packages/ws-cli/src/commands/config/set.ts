// 这个命令的作用是 交互式 在 ws-cli配置文件的 current profile 当中设置 keyId、secret 和 baseUrl 3个配置项的值

import * as inquirer from '@inquirer/prompts'

import {BaseCommand} from '../../lib/base-command.js'
import {ToolConfigManager} from '../../lib/config/index.js'

export default class ConfigSet extends BaseCommand {
  static aliases = ['cf:set']
  static description = '交互式设置当前配置档案的 keyId、secret 与服务端地址(baseUrl)'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    const configManager = ToolConfigManager.fromConfigDir(this.config.configDir)

    // 保证配置文件与默认档案存在, 且已设为当前激活档案
    configManager.ensureConfig()

    const current = configManager.getCurrentProfile()
    if (!current) {
      this.error('未找到当前激活的配置档案, 请先用 `wsc config edit` 设置 current 档案')
    }

    // #region 交互采集 baseUrl / keyId / secret(以现有值作为默认, 直接回车即保留)
    const baseUrl = await inquirer.input({
      default: current.baseUrl,
      message: '请输入服务端地址 (baseUrl):',
      validate: (value) => (value.trim().length > 0 ? true : 'baseUrl 不能为空'),
    })

    const keyId = await inquirer.input({
      default: current.keyId,
      message: '请输入 API Key 标识 (keyId):',
      validate: (value) => (value.trim().length > 0 ? true : 'keyId 不能为空'),
    })

    // secret 是敏感信息, 使用密码模式输入, 终端不回显明文;
    // password 组件不支持默认值, 已有 secret 时用空输入表达"回车保留原值"
    const secretInput = await inquirer.password({
      mask: '*',
      message: current.secret
        ? '请输入 API Key 密钥 (secret), 直接回车保留现有值:'
        : '请输入 API Key 密钥 (secret):',
      validate: (value) => {
        if (current.secret) return true
        return value.trim().length > 0 ? true : 'secret 不能为空'
      },
    })
    const trimmedSecret = secretInput.trim()
    const secret = (trimmedSecret.length > 0) ? trimmedSecret : current.secret
    if (!secret) this.error('secret 不能为空')
    // #endregion

    // 局部更新当前档案的三个字段并持久化
    configManager.updateCurrentProfile({
      baseUrl: baseUrl.trim(),
      keyId: keyId.trim(),
      secret,
    })

    this.log(`已更新档案 "${current.name}" 的 baseUrl、keyId 与 secret`)
  }
}

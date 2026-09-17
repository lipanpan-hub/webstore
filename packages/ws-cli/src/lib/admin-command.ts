import {BaseCommand} from './base-command.js'
import {AdminApiClient} from './api/index.js'
import {ToolConfigManager} from './config/index.js'

/**
 * admin 资源命令基类(模板方法模式)。
 *
 * 在 init 钩子中固定完成「读取配置档案 → 校验 baseUrl/keyId/secret → 构建 AdminApiClient」流程,
 * 子类命令无需重复处理配置与鉴权, 直接使用 this.client 调用 admin API。
 */
export abstract class AdminBaseCommand extends BaseCommand {
  protected client!: AdminApiClient

  async init(): Promise<void> {
    await super.init()

    const profile = ToolConfigManager.fromConfigDir(this.config.configDir).getCurrentProfile()
    if (!profile?.baseUrl?.trim() || !profile?.keyId?.trim() || !profile?.secret?.trim()) {
      throw new Error('当前档案未配置 baseUrl、keyId 或 secret, 请先执行 `wsc config set`')
    }
    this.client = new AdminApiClient(profile.baseUrl.trim(), profile.keyId.trim(), profile.secret.trim())
  }
}

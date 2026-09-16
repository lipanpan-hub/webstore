import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askText} from '../../lib/interactive.js'
import {pickProduct} from '../../lib/pickers.js'

export default class CardAdd extends AdminBaseCommand {
  static description = '为商品导入卡密库存（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -p <productId> -s "密1,密2,密3"']

  static flags = {
    product: Flags.string({char: 'p', description: '商品 ID'}),
    secrets: Flags.string({char: 's', description: '卡密, 逗号分隔'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CardAdd)

    // #region 未通过命令行传入的参数, 交互式补全
    const productId = flags.product ?? (await pickProduct(this.client)).id
    const secrets = flags.secrets !== undefined ? this.parseSecrets(flags.secrets) : await this.askSecrets()
    // #endregion

    const imported = await this.client.importCards(productId, secrets)
    this.log(`已为商品 ${productId} 导入 ${imported} 条卡密`)
  }

  // 逗号分隔的卡密拆分为数组
  private parseSecrets(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  private async askSecrets(): Promise<string[]> {
    const raw = await askText('卡密（逗号分隔）')
    return this.parseSecrets(raw)
  }
}

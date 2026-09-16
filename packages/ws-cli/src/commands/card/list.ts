import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {pickProduct} from '../../lib/pickers.js'

export default class CardList extends AdminBaseCommand {
  static description = '列出商品的所有卡密（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -p <productId>']

  static flags = {
    product: Flags.string({char: 'p', description: '商品 ID'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CardList)

    // 未通过命令行传入的参数, 交互式补全
    const productId = flags.product ?? (await pickProduct(this.client)).id

    const cards = await this.client.listCards(productId)
    for (const c of cards) {
      this.log(`${c.id}  ${c.secret}  [${c.status}]`)
    }
  }
}

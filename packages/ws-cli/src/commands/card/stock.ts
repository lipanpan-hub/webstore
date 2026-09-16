import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {pickProduct} from '../../lib/pickers.js'

export default class CardStock extends AdminBaseCommand {
  static description = '查询商品卡密库存数量（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -p <productId>']

  static flags = {
    product: Flags.string({char: 'p', description: '商品 ID'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CardStock)

    // 未通过命令行传入的参数, 交互式补全
    const productId = flags.product ?? (await pickProduct(this.client)).id

    const stock = await this.client.getCardStock(productId)
    this.log(`商品 ${productId} 当前库存: ${stock}`)
  }
}

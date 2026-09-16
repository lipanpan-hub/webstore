import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askOptionalText} from '../../lib/interactive.js'
import {pickProduct} from '../../lib/pickers.js'

export default class ProductDetail extends AdminBaseCommand {
  static description = '编辑商品详情内容（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -i <productId> -d "<详情内容>"']

  static flags = {
    id: Flags.string({char: 'i', description: '商品 ID'}),
    detail: Flags.string({char: 'd', description: '商品详情内容, 传空字符串则清空'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProductDetail)

    // 未通过命令行传入的参数, 交互式补全
    const id = flags.id ?? (await pickProduct(this.client)).id
    const detail = flags.detail ?? (await askOptionalText('商品详情内容（留空则清空）'))

    const product = await this.client.setProductDetail(id, detail)
    this.log(`商品 ${product.name} 详情已更新（${product.detail.length} 字）`)
  }
}

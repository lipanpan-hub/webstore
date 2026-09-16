import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askNumber, askOptionalText, askText} from '../../lib/interactive.js'
import {pickCategory} from '../../lib/pickers.js'

export default class ProductAdd extends AdminBaseCommand {
  static description = '添加商品（默认下架，缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -c <categoryId> -n "商品名" -p 9.9']

  static flags = {
    category: Flags.string({char: 'c', description: '所属分类 ID'}),
    name: Flags.string({char: 'n', description: '商品名称'}),
    price: Flags.string({char: 'p', description: '商品价格'}),
    desc: Flags.string({char: 'd', description: '商品描述'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProductAdd)

    // #region 未通过命令行传入的参数, 逐项交互式补全
    const categoryId = flags.category ?? (await pickCategory(this.client)).id
    const name = flags.name ?? (await askText('商品名称'))
    const price = flags.price !== undefined ? this.parsePrice(flags.price) : await askNumber('商品价格')
    const description = flags.desc ?? (await askOptionalText('商品描述（可选）'))
    // #endregion

    const product = await this.client.createProduct({categoryId, name, price, description})
    this.log(`已添加商品: ${product.id}  ${product.name}  ￥${product.price}  [${product.status}]`)
  }

  // 校验价格为非负数
  private parsePrice(raw: string): number {
    const value = Number(raw)
    if (Number.isNaN(value) || value < 0) throw new Error('商品价格必须为非负数')
    return value
  }
}

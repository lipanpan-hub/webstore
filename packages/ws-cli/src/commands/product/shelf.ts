import {Flags} from '@oclif/core'

import type {ProductStatus} from '../../lib/api/index.js'
import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askSelect} from '../../lib/interactive.js'
import {pickProduct} from '../../lib/pickers.js'

export default class ProductShelf extends AdminBaseCommand {
  static description = '商品上架 / 下架（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -i <productId> -s on']

  static flags = {
    id: Flags.string({char: 'i', description: '商品 ID'}),
    status: Flags.string({char: 's', description: '目标状态 on|off'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProductShelf)

    // 未通过命令行传入的参数, 交互式补全
    const id = flags.id ?? (await pickProduct(this.client)).id
    const status = flags.status !== undefined ? this.parseStatus(flags.status) : await this.askStatus()

    const product = await this.client.setProductShelf(id, status)
    this.log(`商品 ${product.name} 状态已更新为: ${product.status === 'on' ? '上架' : '下架'}`)
  }

  // 校验状态取值
  private parseStatus(raw: string): ProductStatus {
    if (raw !== 'on' && raw !== 'off') throw new Error('status 只能为 on 或 off')
    return raw
  }

  private askStatus(): Promise<ProductStatus> {
    return askSelect<ProductStatus>('目标状态', [
      {title: '上架 (on)', value: 'on'},
      {title: '下架 (off)', value: 'off'},
    ])
  }
}

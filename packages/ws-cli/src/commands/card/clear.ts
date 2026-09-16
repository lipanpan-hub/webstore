import {Flags} from '@oclif/core'

import type {CardStatus} from '../../lib/api/index.js'
import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askConfirm, askSelect} from '../../lib/interactive.js'
import {pickProduct} from '../../lib/pickers.js'

export default class CardClear extends AdminBaseCommand {
  static description = '批量删除某商品卡密（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -p <productId> -s unsold']

  static flags = {
    product: Flags.string({char: 'p', description: '商品 ID'}),
    status: Flags.string({char: 's', description: '删除范围: unsold | sold, 缺省全部'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CardClear)

    // #region 未传参数时交互补全: 先选商品, 再选删除范围
    const productId = flags.product ?? (await pickProduct(this.client)).id
    const status = flags.status !== undefined ? this.parseStatus(flags.status) : await this.askStatus()
    // #endregion

    const scope = status ? `状态为 ${status} 的` : '全部'
    const confirmed = await askConfirm(`确认删除商品 ${productId} ${scope}卡密？`)
    if (!confirmed) {
      this.log('已取消删除')
      return
    }

    const deleted = await this.client.clearCards(productId, status)
    this.log(`已删除商品 ${productId} 的 ${deleted} 条卡密`)
  }

  // 校验删除范围取值
  private parseStatus(raw: string): CardStatus {
    if (raw !== 'unsold' && raw !== 'sold') throw new Error('status 只能为 unsold 或 sold')
    return raw
  }

  private askStatus(): Promise<CardStatus | undefined> {
    return askSelect<CardStatus | undefined>('删除范围', [
      {title: '全部卡密', value: undefined},
      {title: '仅未售', value: 'unsold'},
      {title: '仅已售', value: 'sold'},
    ])
  }
}

import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {pickCard} from '../../lib/pickers.js'

export default class CardDel extends AdminBaseCommand {
  static description = '删除单条卡密（缺参时交互选择）'

  static examples = ['<%= config.bin %> <%= command.id %> -i <cardId>']

  static flags = {
    id: Flags.string({char: 'i', description: '卡密 ID'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CardDel)

    // 传入 id 直接删除, 否则交互式先选商品再选卡密
    const id = flags.id ?? (await pickCard(this.client)).id

    const deleted = await this.client.deleteCard(id)
    this.log(deleted ? `已删除卡密 ${id}` : `未找到卡密 ${id}`)
  }
}

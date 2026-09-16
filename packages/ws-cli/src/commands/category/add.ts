import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askNumber, askText} from '../../lib/interactive.js'

export default class CategoryAdd extends AdminBaseCommand {
  static description = '添加商品分类（缺参时交互询问）'

  static examples = ['<%= config.bin %> <%= command.id %> -n "账号类" -s 1']

  static flags = {
    name: Flags.string({char: 'n', description: '分类名称'}),
    sort: Flags.integer({char: 's', description: '排序权重'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CategoryAdd)

    // 未通过命令行传入的参数, 逐项交互式补全
    const name = flags.name ?? (await askText('分类名称'))
    const sort = flags.sort ?? (await askNumber('排序权重'))

    const category = await this.client.createCategory(name, sort)
    this.log(`已添加分类: ${category.id}  ${category.name}`)
  }
}

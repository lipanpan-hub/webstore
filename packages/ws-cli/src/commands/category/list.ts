import {AdminBaseCommand} from '../../lib/admin-command.js'

export default class CategoryList extends AdminBaseCommand {
  static description = '列出所有分类'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.parse(CategoryList)

    const list = await this.client.listCategories()
    for (const c of list) {
      this.log(`${c.id}  [sort=${c.sort}]  ${c.name}`)
    }
  }
}

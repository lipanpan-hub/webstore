import {AdminBaseCommand} from '../../lib/admin-command.js'

export default class ProductList extends AdminBaseCommand {
  static description = '列出所有商品'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.parse(ProductList)

    const list = await this.client.listProducts()
    for (const p of list) {
      this.log(`${p.id}  ${p.name}  ￥${p.price}  [${p.status}]  cat=${p.categoryId}`)
    }
  }
}

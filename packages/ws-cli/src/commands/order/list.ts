import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printOrder} from '../../lib/display.js'

export default class OrderList extends AdminBaseCommand {
  static description = '查询订单列表'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.parse(OrderList)

    const list = await this.client.listOrders()
    if (list.length === 0) {
      this.log('暂无订单')
      return
    }
    for (const o of list) {
      printOrder(o)
    }
  }
}

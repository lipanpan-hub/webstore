import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printOrder} from '../../lib/display.js'

export default class OrderGet extends AdminBaseCommand {
  static description = '查询订单详情'

  static examples = ['<%= config.bin %> <%= command.id %> -i <orderId>']

  static flags = {
    id: Flags.string({char: 'i', description: '订单 ID', required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(OrderGet)

    const order = await this.client.getOrder(flags.id)
    printOrder(order)
  }
}

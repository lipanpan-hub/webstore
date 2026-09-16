import {Flags} from '@oclif/core'

import {AdminBaseCommand} from '../../lib/admin-command.js'
import {askConfirm} from '../../lib/interactive.js'
import {pickPayment} from '../../lib/pickers.js'

export default class PaymentRemove extends AdminBaseCommand {
  static description = '删除支付方式（缺参时交互选择）'

  static examples = ['<%= config.bin %> <%= command.id %> -i <paymentId>']

  static flags = {
    id: Flags.string({char: 'i', description: '支付方式 ID'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PaymentRemove)

    // 传入 id 直接删除, 否则交互式选择
    const payment = flags.id ? {id: flags.id, name: flags.id} : await pickPayment(this.client)
    if (!(await askConfirm(`确认删除支付方式 ${payment.name}?`))) return

    await this.client.deletePayment(payment.id)
    this.log(`已删除支付方式: ${payment.id}`)
  }
}

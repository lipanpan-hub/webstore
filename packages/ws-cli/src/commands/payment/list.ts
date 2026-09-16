import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printPaymentDetail} from '../../lib/display.js'

export default class PaymentList extends AdminBaseCommand {
  static description = '列出所有支付方式及服务商配置'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.parse(PaymentList)

    const list = await this.client.listPayments()
    for (const p of list) {
      printPaymentDetail(p)
    }
  }
}

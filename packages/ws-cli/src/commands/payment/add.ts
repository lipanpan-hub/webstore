import {Flags} from '@oclif/core'

import type {PaymentProvider} from '../../lib/api/index.js'
import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printPaymentDetail} from '../../lib/display.js'
import {askNumber, askSelect, askText} from '../../lib/interactive.js'
import {PAYMENT_PROVIDERS, getPaymentProviderDef, promptProviderConfig} from '../../lib/providers.js'

export default class PaymentAdd extends AdminBaseCommand {
  static description = '添加支付方式（选择服务商并录入配置）'

  static examples = ['<%= config.bin %> <%= command.id %> -n "支付宝" -s 1']

  static flags = {
    name: Flags.string({char: 'n', description: '支付方式名称'}),
    sort: Flags.integer({char: 's', description: '排序权重'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PaymentAdd)

    // #region 交互采集: 服务商 → 名称 → 配置 → 排序
    const provider = await askSelect<PaymentProvider>(
      '选择支付服务商',
      PAYMENT_PROVIDERS.map((p) => ({title: p.label, value: p.provider})),
    )
    const def = getPaymentProviderDef(provider)
    const name = flags.name ?? (await askText('支付方式名称', def.label))
    const config = await promptProviderConfig(def.fields)
    const sort = flags.sort ?? (await askNumber('排序权重'))
    // #endregion

    const payment = await this.client.createPayment({name, provider, config, sort})
    this.log('已添加支付方式:')
    printPaymentDetail(payment)
  }
}

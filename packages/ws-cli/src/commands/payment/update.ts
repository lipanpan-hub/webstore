import {Flags} from '@oclif/core'

import type {PaymentMethodDetail, UpdatePaymentInput} from '../../lib/api/index.js'
import {AdminBaseCommand} from '../../lib/admin-command.js'
import {printPaymentDetail} from '../../lib/display.js'
import {askNumber, askSelect, askText} from '../../lib/interactive.js'
import {getPaymentProviderDef, promptProviderConfig} from '../../lib/providers.js'
import {pickPayment} from '../../lib/pickers.js'

export default class PaymentUpdate extends AdminBaseCommand {
  static description = '更新支付方式与服务商配置（缺参时交互询问）'

  static examples = [
    '<%= config.bin %> <%= command.id %> -i <paymentId> -e false',
    '<%= config.bin %> <%= command.id %> -i <paymentId> -n "新名称" -s 2',
  ]

  static flags = {
    id: Flags.string({char: 'i', description: '支付方式 ID'}),
    name: Flags.string({char: 'n', description: '支付方式名称'}),
    sort: Flags.integer({char: 's', description: '排序权重'}),
    enabled: Flags.string({char: 'e', description: '是否启用 true|false'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PaymentUpdate)

    // 传入 id 时按 id 精确查找, 否则交互式选择
    const target = flags.id ? await this.pickById(flags.id) : await pickPayment(this.client)

    // 命令行指定字段时只改这些字段; 否则进入交互补全(含服务商配置)
    const changes = this.hasFlag(flags) ? this.fromFlags(flags) : await this.fromPrompts(target)

    const payment = await this.client.updatePayment(target.id, changes)
    this.log('已更新支付方式:')
    printPaymentDetail(payment)
  }

  // 按 id 拉取列表后精确匹配, 找不到时给出明确错误
  private async pickById(id: string): Promise<PaymentMethodDetail> {
    const list = await this.client.listPayments()
    const found = list.find((p) => p.id === id)
    if (!found) throw new Error(`支付方式不存在: ${id}`)
    return found
  }

  private hasFlag(flags: {enabled?: string; name?: string; sort?: number;}): boolean {
    return flags.name !== undefined || flags.sort !== undefined || flags.enabled !== undefined
  }

  private fromFlags(flags: {enabled?: string; name?: string; sort?: number;}): UpdatePaymentInput {
    return {
      name: flags.name,
      sort: flags.sort,
      enabled: flags.enabled !== undefined ? this.parseEnabled(flags.enabled) : undefined,
    }
  }

  // 校验启用状态取值
  private parseEnabled(raw: string): boolean {
    if (raw !== 'true' && raw !== 'false') throw new Error('enabled 只能为 true 或 false')
    return raw === 'true'
  }

  private async fromPrompts(
    target: PaymentMethodDetail,
  ): Promise<{config: Record<string, string>; enabled: boolean; name: string; sort: number;}> {
    const name = await askText('支付方式名称', target.name)
    const sort = await askNumber('排序权重')
    const enabled = await askSelect<boolean>('状态', [
      {title: '启用', value: true},
      {title: '停用', value: false},
    ])
    const config = await promptProviderConfig(getPaymentProviderDef(target.provider).fields, target.config)
    return {name, sort, enabled, config}
  }
}

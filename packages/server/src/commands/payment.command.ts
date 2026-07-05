import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import type { PaymentMethodDetail, PaymentProvider } from '@webstore/shared'
import { PaymentService } from '../payment/payment.service.js'
import {
  PAYMENT_PROVIDERS,
  getProviderDef,
  maskSecret,
  type ProviderDef,
} from '../payment/payment.provider.js'
import { askText, askOptionalText, askNumber, askSelect, askConfirm, pickFuzzy } from './interactive.js'

interface AddOptions {
  name?: string
  sort?: number
}

interface UpdateOptions {
  id?: string
  name?: string
  sort?: number
  enabled?: boolean
}

interface RemoveOptions {
  id?: string
}

//#region 公共工具
async function pickPayment(service: PaymentService): Promise<PaymentMethodDetail> {
  const list = await service.findAll()
  if (list.length === 0) throw new Error('暂无支付方式，请先执行 payment add')
  return pickFuzzy(
    '选择支付方式',
    list,
    (p) => `${p.name}  [${getProviderDef(p.provider).label}]  [${p.enabled ? '启用' : '停用'}]  (${p.id})`,
  )
}

// 逐项交互式录入某服务商的配置，current 提供更新时的初始值
async function promptConfig(
  def: ProviderDef,
  current: Record<string, string> = {},
): Promise<Record<string, string>> {
  const config: Record<string, string> = {}
  for (const field of def.fields) {
    const label = field.secret ? `${field.label}（敏感）` : field.label
    config[field.key] = await askOptionalText(label, current[field.key])
  }
  return config
}

function printDetail(p: PaymentMethodDetail): void {
  const def = getProviderDef(p.provider)
  console.log(`${p.id}  [sort=${p.sort}]  [${p.enabled ? '启用' : '停用'}]  ${p.name}  <${def.label}>`)
  for (const field of def.fields) {
    const raw = p.config[field.key] ?? ''
    console.log(`    ${field.label}: ${field.secret ? maskSecret(raw) : raw || '(未配置)'}`)
  }
}
//#endregion

@SubCommand({ name: 'add', description: '添加支付方式（选择服务商并录入配置）' })
class PaymentAddCommand extends CommandRunner {
  constructor(private readonly paymentService: PaymentService) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    const provider = await askSelect<PaymentProvider>(
      '选择支付服务商',
      PAYMENT_PROVIDERS.map((p) => ({ title: p.label, value: p.provider })),
    )
    const def = getProviderDef(provider)

    const name = options.name ?? (await askText('支付方式名称', def.label))
    const config = await promptConfig(def)
    const sort = options.sort ?? (await askNumber('排序权重'))

    const payment = await this.paymentService.create({ name, provider, config, sort })
    console.log('已添加支付方式:')
    printDetail(payment)
  }

  @Option({ flags: '-n, --name <name>', description: '支付方式名称' })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-s, --sort <sort>', description: '排序权重' })
  parseSort(v: string): number {
    return Number(v)
  }
}

@SubCommand({ name: 'update', description: '更新支付方式与服务商配置（缺参时交互询问）' })
class PaymentUpdateCommand extends CommandRunner {
  constructor(private readonly paymentService: PaymentService) {
    super()
  }

  async run(_inputs: string[], options: UpdateOptions): Promise<void> {
    const target = options.id
      ? await this.pickById(options.id)
      : await pickPayment(this.paymentService)

    // 命令行指定字段时只改这些字段；否则进入交互补全（含服务商配置）
    const changes = this.hasFlag(options)
      ? this.fromFlags(options)
      : await this.fromPrompts(target)

    const payment = await this.paymentService.update(target.id, changes)
    console.log('已更新支付方式:')
    printDetail(payment)
  }

  private async pickById(id: string): Promise<PaymentMethodDetail> {
    const list = await this.paymentService.findAll()
    const found = list.find((p) => p.id === id)
    if (!found) throw new Error(`支付方式不存在: ${id}`)
    return found
  }

  private hasFlag(o: UpdateOptions): boolean {
    return o.name !== undefined || o.sort !== undefined || o.enabled !== undefined
  }

  private fromFlags(o: UpdateOptions): { name?: string; sort?: number; enabled?: boolean } {
    return { name: o.name, sort: o.sort, enabled: o.enabled }
  }

  private async fromPrompts(
    target: PaymentMethodDetail,
  ): Promise<{ name: string; sort: number; enabled: boolean; config: Record<string, string> }> {
    const name = await askText('支付方式名称', target.name)
    const sort = await askNumber('排序权重')
    const enabled = await askSelect<boolean>('状态', [
      { title: '启用', value: true },
      { title: '停用', value: false },
    ])
    const config = await promptConfig(getProviderDef(target.provider), target.config)
    return { name, sort, enabled, config }
  }

  @Option({ flags: '-i, --id <id>', description: '支付方式 ID' })
  parseId(v: string): string {
    return v
  }

  @Option({ flags: '-n, --name <name>', description: '支付方式名称' })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-s, --sort <sort>', description: '排序权重' })
  parseSort(v: string): number {
    return Number(v)
  }

  @Option({ flags: '-e, --enabled <enabled>', description: '是否启用 true|false' })
  parseEnabled(v: string): boolean {
    return v === 'true'
  }
}

@SubCommand({ name: 'remove', description: '删除支付方式' })
class PaymentRemoveCommand extends CommandRunner {
  constructor(private readonly paymentService: PaymentService) {
    super()
  }

  async run(_inputs: string[], options: RemoveOptions): Promise<void> {
    const payment = options.id
      ? { id: options.id, name: options.id }
      : await pickPayment(this.paymentService)
    if (!(await askConfirm(`确认删除支付方式 ${payment.name}?`))) return

    await this.paymentService.remove(payment.id)
    console.log(`已删除支付方式: ${payment.id}`)
  }

  @Option({ flags: '-i, --id <id>', description: '支付方式 ID' })
  parseId(v: string): string {
    return v
  }
}

@SubCommand({ name: 'list', description: '列出所有支付方式及服务商配置' })
class PaymentListCommand extends CommandRunner {
  constructor(private readonly paymentService: PaymentService) {
    super()
  }

  async run(): Promise<void> {
    const list = await this.paymentService.findAll()
    for (const p of list) {
      printDetail(p)
    }
  }
}

@Command({
  name: 'payment',
  description: '支付方式管理',
  subCommands: [PaymentAddCommand, PaymentUpdateCommand, PaymentRemoveCommand, PaymentListCommand],
})
export class PaymentCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: payment <add|update|remove|list>')
  }
}

export const paymentCommandProviders = [
  PaymentCommand,
  PaymentAddCommand,
  PaymentUpdateCommand,
  PaymentRemoveCommand,
  PaymentListCommand,
]

import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import type { CardStatus } from '@webstore/shared'
import { CardService } from '../card/card.service.js'
import { ProductService } from '../product/product.service.js'
import { askConfirm, askSelect, askText, pickFuzzy } from './interactive.js'

interface AddOptions {
  product?: string
  secrets?: string[]
}

interface StockOptions {
  product?: string
}

interface DelOptions {
  id?: string
}

interface ClearOptions {
  product?: string
  status?: CardStatus
}

@SubCommand({ name: 'add', description: '为商品导入卡密库存（缺参时交互询问）' })
class CardAddCommand extends CommandRunner {
  constructor(
    private readonly cardService: CardService,
    private readonly productService: ProductService,
  ) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    // 未通过命令行传入的参数，逐项交互式补全
    const product = options.product ?? (await this.pickProduct())
    const secrets = options.secrets ?? (await this.askSecrets())

    const count = await this.cardService.addCards(product, secrets)
    console.log(`已为商品 ${product} 导入 ${count} 条卡密`)
  }

  private async pickProduct(): Promise<string> {
    const products = await this.productService.findAll()
    if (products.length === 0) throw new Error('暂无商品，请先执行 product add')
    const picked = await pickFuzzy(
      '选择商品',
      products,
      (p) => `${p.name}  ￥${p.price}  [${p.status}]  (${p.id})`,
    )
    return picked.id
  }

  private async askSecrets(): Promise<string[]> {
    const raw = await askText('卡密（逗号分隔）')
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  @Option({ flags: '-p, --product <productId>', description: '商品 ID' })
  parseProduct(v: string): string {
    return v
  }

  @Option({ flags: '-s, --secrets <secrets>', description: '卡密，逗号分隔' })
  parseSecrets(v: string): string[] {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

@SubCommand({ name: 'stock', description: '查询商品卡密库存数量（缺参时交互询问）' })
class CardStockCommand extends CommandRunner {
  constructor(
    private readonly cardService: CardService,
    private readonly productService: ProductService,
  ) {
    super()
  }

  async run(_inputs: string[], options: StockOptions): Promise<void> {
    // 未通过命令行传入的参数，逐项交互式补全
    const product = options.product ?? (await this.pickProduct())

    const stock = await this.cardService.countStock(product)
    console.log(`商品 ${product} 当前库存: ${stock}`)
  }

  private async pickProduct(): Promise<string> {
    const products = await this.productService.findAll()
    if (products.length === 0) throw new Error('暂无商品，请先执行 product add')
    const picked = await pickFuzzy(
      '选择商品',
      products,
      (p) => `${p.name}  ￥${p.price}  [${p.status}]  (${p.id})`,
    )
    return picked.id
  }

  @Option({ flags: '-p, --product <productId>', description: '商品 ID' })
  parseProduct(v: string): string {
    return v
  }
}

@SubCommand({ name: 'del', description: '删除单条卡密（缺参时交互选择）' })
class CardDelCommand extends CommandRunner {
  constructor(
    private readonly cardService: CardService,
    private readonly productService: ProductService,
  ) {
    super()
  }

  async run(_inputs: string[], options: DelOptions): Promise<void> {
    // 传入 id 直接删除，否则交互式选商品再选卡密
    const id = options.id ?? (await this.pickCardId())

    const ok = await this.cardService.deleteCard(id)
    console.log(ok ? `已删除卡密 ${id}` : `未找到卡密 ${id}`)
  }

  private async pickCardId(): Promise<string> {
    const products = await this.productService.findAll()
    if (products.length === 0) throw new Error('暂无商品，请先执行 product add')
    const product = await pickFuzzy(
      '选择商品',
      products,
      (p) => `${p.name}  ￥${p.price}  [${p.status}]  (${p.id})`,
    )
    const cards = await this.cardService.listByProduct(product.id)
    if (cards.length === 0) throw new Error('该商品暂无卡密')
    const card = await pickFuzzy(
      '选择卡密',
      cards,
      (c) => `${c.secret}  [${c.status}]  (${c.id})`,
    )
    return card.id
  }

  @Option({ flags: '-i, --id <cardId>', description: '卡密 ID' })
  parseId(v: string): string {
    return v
  }
}

@SubCommand({ name: 'clear', description: '批量删除某商品卡密（缺参时交互询问）' })
class CardClearCommand extends CommandRunner {
  constructor(
    private readonly cardService: CardService,
    private readonly productService: ProductService,
  ) {
    super()
  }

  async run(_inputs: string[], options: ClearOptions): Promise<void> {
    // 未传参数时交互补全：先选商品，再选删除范围
    const product = options.product ?? (await this.pickProduct())
    const status = options.status ?? (await this.pickStatus())

    const scope = status ? `状态为 ${status} 的` : '全部'
    const confirmed = await askConfirm(`确认删除商品 ${product} ${scope}卡密？`)
    if (!confirmed) {
      console.log('已取消删除')
      return
    }

    const count = await this.cardService.deleteByProduct(product, status)
    console.log(`已删除商品 ${product} 的 ${count} 条卡密`)
  }

  private async pickProduct(): Promise<string> {
    const products = await this.productService.findAll()
    if (products.length === 0) throw new Error('暂无商品，请先执行 product add')
    const picked = await pickFuzzy(
      '选择商品',
      products,
      (p) => `${p.name}  ￥${p.price}  [${p.status}]  (${p.id})`,
    )
    return picked.id
  }

  private async pickStatus(): Promise<CardStatus | undefined> {
    return askSelect<CardStatus | undefined>('删除范围', [
      { title: '全部卡密', value: undefined },
      { title: '仅未售', value: 'unsold' },
      { title: '仅已售', value: 'sold' },
    ])
  }

  @Option({ flags: '-p, --product <productId>', description: '商品 ID' })
  parseProduct(v: string): string {
    return v
  }

  @Option({ flags: '-s, --status <status>', description: '删除范围：unsold | sold，缺省全部' })
  parseStatus(v: string): CardStatus {
    if (v !== 'unsold' && v !== 'sold') throw new Error('status 只能是 unsold 或 sold')
    return v
  }
}

@Command({
  name: 'card',
  description: '卡密库存管理',
  subCommands: [CardAddCommand, CardStockCommand, CardDelCommand, CardClearCommand],
})
export class CardCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: card <add|stock>')
  }
}

export const cardCommandProviders = [
  CardCommand,
  CardAddCommand,
  CardStockCommand,
  CardDelCommand,
  CardClearCommand,
]

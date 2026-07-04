import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import { CardService } from '../card/card.service.js'

interface AddOptions {
  product: string
  secrets: string[]
}

interface StockOptions {
  product: string
}

@SubCommand({ name: 'add', description: '为商品导入卡密库存' })
class CardAddCommand extends CommandRunner {
  constructor(private readonly cardService: CardService) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    const count = await this.cardService.addCards(options.product, options.secrets)
    console.log(`已为商品 ${options.product} 导入 ${count} 条卡密`)
  }

  @Option({ flags: '-p, --product <productId>', description: '商品 ID', required: true })
  parseProduct(v: string): string {
    return v
  }

  @Option({ flags: '-s, --secrets <secrets>', description: '卡密，逗号分隔', required: true })
  parseSecrets(v: string): string[] {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

@SubCommand({ name: 'stock', description: '查询商品卡密库存数量' })
class CardStockCommand extends CommandRunner {
  constructor(private readonly cardService: CardService) {
    super()
  }

  async run(_inputs: string[], options: StockOptions): Promise<void> {
    const stock = await this.cardService.countStock(options.product)
    console.log(`商品 ${options.product} 当前库存: ${stock}`)
  }

  @Option({ flags: '-p, --product <productId>', description: '商品 ID', required: true })
  parseProduct(v: string): string {
    return v
  }
}

@Command({
  name: 'card',
  description: '卡密库存管理',
  subCommands: [CardAddCommand, CardStockCommand],
})
export class CardCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: card <add|stock>')
  }
}

export const cardCommandProviders = [CardCommand, CardAddCommand, CardStockCommand]

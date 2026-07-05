import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import type { ProductStatus } from '@webstore/shared'
import { ProductService } from '../product/product.service.js'
import { CategoryService } from '../category/category.service.js'
import { askText, askOptionalText, askNumber, askSelect, pickFuzzy } from './interactive.js'

interface AddOptions {
  category?: string
  name?: string
  price?: number
  desc?: string
}

interface ShelfOptions {
  id?: string
  status?: ProductStatus
}

interface DetailOptions {
  id?: string
  detail?: string
}

@SubCommand({ name: 'add', description: '添加商品（默认下架，缺参时交互询问）' })
class ProductAddCommand extends CommandRunner {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
  ) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    // 未通过命令行传入的参数，逐项交互式补全
    const categoryId = options.category ?? (await this.pickCategory())
    const name = options.name ?? (await askText('商品名称'))
    const price = options.price ?? (await askNumber('商品价格'))
    const description = options.desc ?? (await askOptionalText('商品描述（可选）'))

    const product = await this.productService.create({ categoryId, name, price, description })
    console.log(`已添加商品: ${product.id}  ${product.name}  ￥${product.price}  [${product.status}]`)
  }

  private async pickCategory(): Promise<string> {
    const categories = await this.categoryService.findAll()
    if (categories.length === 0) throw new Error('暂无分类，请先执行 category add')
    const picked = await pickFuzzy('选择所属分类', categories, (c) => `${c.name}  (${c.id})`)
    return picked.id
  }

  @Option({ flags: '-c, --category <categoryId>', description: '所属分类 ID' })
  parseCategory(v: string): string {
    return v
  }

  @Option({ flags: '-n, --name <name>', description: '商品名称' })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-p, --price <price>', description: '商品价格' })
  parsePrice(v: string): number {
    return Number(v)
  }

  @Option({ flags: '-d, --desc <desc>', description: '商品描述' })
  parseDesc(v: string): string {
    return v
  }
}

@SubCommand({ name: 'shelf', description: '商品上架/下架' })
class ProductShelfCommand extends CommandRunner {
  constructor(private readonly productService: ProductService) {
    super()
  }

  async run(_inputs: string[], options: ShelfOptions): Promise<void> {
    // 未通过命令行传入的参数，逐项交互式补全
    const id = options.id ?? (await this.pickProduct())
    const status = options.status ?? (await this.pickStatus())

    const product = await this.productService.setStatus(id, status)
    console.log(`商品 ${product.name} 状态已更新为: ${product.status === 'on' ? '上架' : '下架'}`)
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

  private async pickStatus(): Promise<ProductStatus> {
    return askSelect<ProductStatus>('目标状态', [
      { title: '上架 (on)', value: 'on' },
      { title: '下架 (off)', value: 'off' },
    ])
  }

  @Option({ flags: '-i, --id <id>', description: '商品 ID' })
  parseId(v: string): string {
    return v
  }

  @Option({ flags: '-s, --status <status>', description: '目标状态 on|off' })
  parseStatus(v: string): ProductStatus {
    if (v !== 'on' && v !== 'off') throw new Error('status 只能为 on 或 off')
    return v
  }
}

@SubCommand({ name: 'detail', description: '编辑商品详情内容' })
class ProductDetailCommand extends CommandRunner {
  constructor(private readonly productService: ProductService) {
    super()
  }

  async run(_inputs: string[], options: DetailOptions): Promise<void> {
    // 未通过命令行传入的参数，逐项交互式补全
    const id = options.id ?? (await this.pickProduct())
    const detail = options.detail ?? (await askOptionalText('商品详情内容（留空则清空）'))

    const product = await this.productService.setDetail(id, detail)
    console.log(`商品 ${product.name} 详情已更新（${product.detail.length} 字）`)
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

  @Option({ flags: '-i, --id <id>', description: '商品 ID' })
  parseId(v: string): string {
    return v
  }

  @Option({ flags: '-d, --detail <detail>', description: '商品详情内容' })
  parseDetail(v: string): string {
    return v
  }
}

@SubCommand({ name: 'list', description: '列出所有商品' })
class ProductListCommand extends CommandRunner {
  constructor(private readonly productService: ProductService) {
    super()
  }

  async run(): Promise<void> {
    const list = await this.productService.findAll()
    for (const p of list) {
      console.log(`${p.id}  ${p.name}  ￥${p.price}  [${p.status}]  cat=${p.categoryId}`)
    }
  }
}

@Command({
  name: 'product',
  description: '商品管理',
  subCommands: [ProductAddCommand, ProductShelfCommand, ProductDetailCommand, ProductListCommand],
})
export class ProductCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: product <add|shelf|detail|list>')
  }
}

export const productCommandProviders = [
  ProductCommand,
  ProductAddCommand,
  ProductShelfCommand,
  ProductDetailCommand,
  ProductListCommand,
]

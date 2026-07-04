import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import { CategoryService } from '../category/category.service.js'

interface AddOptions {
  name: string
  sort?: number
}

@SubCommand({ name: 'add', description: '添加商品分类' })
class CategoryAddCommand extends CommandRunner {
  constructor(private readonly categoryService: CategoryService) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    const category = await this.categoryService.create(options.name, options.sort)
    console.log(`已添加分类: ${category.id}  ${category.name}`)
  }

  @Option({ flags: '-n, --name <name>', description: '分类名称', required: true })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-s, --sort <sort>', description: '排序权重' })
  parseSort(v: string): number {
    return Number(v)
  }
}

@SubCommand({ name: 'list', description: '列出所有分类' })
class CategoryListCommand extends CommandRunner {
  constructor(private readonly categoryService: CategoryService) {
    super()
  }

  async run(): Promise<void> {
    const list = await this.categoryService.findAll()
    for (const c of list) console.log(`${c.id}  [sort=${c.sort}]  ${c.name}`)
  }
}

@Command({
  name: 'category',
  description: '分类管理',
  subCommands: [CategoryAddCommand, CategoryListCommand],
})
export class CategoryCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: category <add|list>')
  }
}

export const categoryCommandProviders = [
  CategoryCommand,
  CategoryAddCommand,
  CategoryListCommand,
]

import { input, number, confirm, select, search } from '@inquirer/prompts'
import Fuse from 'fuse.js'

// 外观模式：封装 @inquirer/prompts + fuse.js 的交互细节，命令层只依赖下方简洁接口

//#region 内部工具
async function run<T>(task: Promise<T>): Promise<T> {
  try {
    return await task
  } catch (err) {
    // inquirer 在 Ctrl+C 取消时抛出 ExitPromptError
    if (err instanceof Error && err.name === 'ExitPromptError') {
      console.log('已取消操作')
      process.exit(1)
    }
    throw err
  }
}
//#endregion

//#region 文本 / 数字输入
export async function askText(message: string, initial?: string): Promise<string> {
  const value = await run(
    input({ message, default: initial, validate: (v) => (v.trim() ? true : '不能为空') }),
  )
  return value.trim()
}

export async function askOptionalText(message: string, initial?: string): Promise<string> {
  const value = await run(input({ message, default: initial }))
  return value.trim()
}

export async function askNumber(message: string): Promise<number> {
  const value = await run(
    number({ message, validate: (v) => (v !== undefined && v >= 0 ? true : '必须为非负数') }),
  )
  return value as number
}
//#endregion

//#region 确认
export async function askConfirm(message: string): Promise<boolean> {
  return run(confirm({ message, default: false }))
}
//#endregion

//#region 固定项选择
export async function askSelect<T>(
  message: string,
  options: { title: string; value: T }[],
): Promise<T> {
  return run(select({ message, choices: options.map((o) => ({ name: o.title, value: o.value })) }))
}
//#endregion

//#region 模糊选择
export async function pickFuzzy<T>(
  message: string,
  items: T[],
  toLabel: (item: T) => string,
): Promise<T> {
  const choices = items.map((item) => ({ name: toLabel(item), value: item }))
  const fuse = new Fuse(choices, { keys: ['name'], threshold: 0.4 })
  return run(
    search({
      message,
      source: async (term) => (term ? fuse.search(term).map((r) => r.item) : choices),
    }),
  )
}
//#endregion

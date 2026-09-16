import {checkbox, confirm, input, number, search, select} from '@inquirer/prompts'
import Fuse from 'fuse.js'

// 交互原语(外观模式): 封装 @inquirer/prompts + fuse.js 的细节, 命令层只依赖下方简洁接口。
// 与服务端本地 CLI 的 interactive.ts 保持一致的行为。

//#region 内部工具
async function run<T>(task: Promise<T>): Promise<T> {
  try {
    return await task
  } catch (error) {
    // inquirer 在 Ctrl+C 取消时抛出 ExitPromptError
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('已取消操作')
      // 用户主动取消: 直接退出进程, 避免抛错打印堆栈
      // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
      process.exit(1)
    }
    throw error
  }
}
//#endregion

//#region 文本 / 数字输入
export async function askText(message: string, initial?: string): Promise<string> {
  const value = await run(
    input({message, default: initial, validate: (v) => (v.trim() ? true : '不能为空')}),
  )
  return value.trim()
}

export async function askOptionalText(message: string, initial?: string): Promise<string> {
  const value = await run(input({message, default: initial}))
  return value.trim()
}

export async function askNumber(message: string): Promise<number> {
  const value = await run(
    number({message, validate: (v) => (v !== undefined && v >= 0 ? true : '必须为非负数')}),
  )
  return value as number
}
//#endregion

//#region 确认
export async function askConfirm(message: string): Promise<boolean> {
  return run(confirm({message, default: false}))
}
//#endregion

//#region 固定项选择
export async function askSelect<T>(
  message: string,
  options: {title: string; value: T}[],
): Promise<T> {
  return run(select({message, choices: options.map((o) => ({name: o.title, value: o.value}))}))
}
//#endregion

//#region 多选
export async function askMultiSelect<T>(
  message: string,
  options: {checked?: boolean; title: string; value: T;}[],
): Promise<T[]> {
  return run(
    checkbox({
      message,
      choices: options.map((o) => ({name: o.title, value: o.value, checked: o.checked})),
    }),
  )
}
//#endregion

//#region 模糊选择
export async function pickFuzzy<T>(
  message: string,
  items: T[],
  toLabel: (item: T) => string,
): Promise<T> {
  const choices = items.map((item) => ({name: toLabel(item), value: item}))
  const fuse = new Fuse(choices, {keys: ['name'], threshold: 0.4})
  return run(
    search({
      message,
      source: async (term) => (term ? fuse.search(term).map((r) => r.item) : choices),
    }),
  )
}
//#endregion

import prompts from 'prompts'
import Fuse from 'fuse.js'

// 外观模式：封装 prompts + fuse.js 的交互细节，命令层只依赖下方简洁接口

//#region 内部工具
function onCancel(): never {
  console.log('已取消操作')
  process.exit(1)
}
//#endregion

//#region 文本 / 数字输入
export async function askText(message: string, initial?: string): Promise<string> {
  const { value } = await prompts(
    {
      type: 'text',
      name: 'value',
      message,
      initial,
      validate: (v: string) => (v && v.trim() ? true : '不能为空'),
    },
    { onCancel },
  )
  return (value as string).trim()
}

export async function askOptionalText(message: string, initial?: string): Promise<string> {
  const { value } = await prompts({ type: 'text', name: 'value', message, initial }, { onCancel })
  return ((value as string) ?? '').trim()
}

export async function askNumber(message: string): Promise<number> {
  const { value } = await prompts(
    {
      type: 'number',
      name: 'value',
      message,
      validate: (v: number) => (v >= 0 ? true : '必须为非负数'),
    },
    { onCancel },
  )
  return value as number
}
//#endregion

//#region 确认
export async function askConfirm(message: string): Promise<boolean> {
  const { value } = await prompts(
    { type: 'confirm', name: 'value', message, initial: false },
    { onCancel },
  )
  return value as boolean
}
//#endregion

//#region 固定项选择
export async function askSelect<T>(
  message: string,
  options: { title: string; value: T }[],
): Promise<T> {
  const { value } = await prompts(
    { type: 'select', name: 'value', message, choices: options },
    { onCancel },
  )
  return value as T
}
//#endregion

//#region 模糊选择
export async function pickFuzzy<T>(
  message: string,
  items: T[],
  toLabel: (item: T) => string,
): Promise<T> {
  // 直接用 item 作对象作为 value：prompts 内部以 `||` 取值，索引 0 会被当成 falsy 而误取 title
  const choices = items.map((item) => ({ title: toLabel(item), value: item }))
  const fuse = new Fuse(choices, { keys: ['title'], threshold: 0.4 })
  const { value } = await prompts(
    {
      type: 'autocomplete',
      name: 'value',
      message,
      choices,
      suggest: async (input: string) =>
        input ? fuse.search(input).map((r) => r.item) : choices,
    },
    { onCancel },
  )
  return value as T
}
//#endregion

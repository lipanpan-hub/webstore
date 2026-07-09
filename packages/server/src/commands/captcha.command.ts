import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import type { CaptchaProvider, CaptchaSetting } from '@webstore/shared'
import { CaptchaService } from '../captcha/captcha.service.js'
import {
  CAPTCHA_PROVIDERS,
  getCaptchaProviderDef,
  maskSecret,
  type CaptchaProviderDef,
} from '../captcha/captcha.provider.js'
import { askOptionalText, askNumber, askSelect, askConfirm, pickFuzzy } from './interactive.js'

interface AddOptions {
  sort?: number
}

interface UpdateOptions {
  id?: string
  sort?: number
  enabled?: boolean
}

interface RemoveOptions {
  id?: string
}

//#region 公共工具
async function pickCaptcha(service: CaptchaService): Promise<CaptchaSetting> {
  const list = await service.findAll()
  if (list.length === 0) throw new Error('暂无验证码配置，请先执行 captcha add')
  return pickFuzzy(
    '选择验证码配置',
    list,
    (c) => `${getCaptchaProviderDef(c.provider).label}  [${c.enabled ? '启用' : '停用'}]  (${c.id})`,
  )
}

// 逐项交互式录入某服务商的配置，current 提供更新时的初始值
async function promptConfig(
  def: CaptchaProviderDef,
  current: Record<string, string> = {},
): Promise<Record<string, string>> {
  const config: Record<string, string> = {}
  for (const field of def.fields) {
    const label = field.secret ? `${field.label}（敏感）` : field.label
    config[field.key] = await askOptionalText(label, current[field.key] ?? field.defaultValue)
  }
  return config
}

function printDetail(c: CaptchaSetting): void {
  const def = getCaptchaProviderDef(c.provider)
  console.log(`${c.id}  [sort=${c.sort}]  [${c.enabled ? '启用' : '停用'}]  <${def.label}>`)
  for (const field of def.fields) {
    const raw = c.config[field.key] ?? ''
    const shown = field.secret ? maskSecret(raw) : raw || '(未配置)'
    console.log(`    ${field.label}: ${shown}`)
  }
}
//#endregion

@SubCommand({ name: 'add', description: '添加验证码配置（选择服务商并录入参数）' })
class CaptchaAddCommand extends CommandRunner {
  constructor(private readonly captchaService: CaptchaService) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    const provider = await askSelect<CaptchaProvider>(
      '选择验证码服务商',
      CAPTCHA_PROVIDERS.map((p) => ({ title: p.label, value: p.provider })),
    )
    const def = getCaptchaProviderDef(provider)
    const config = await promptConfig(def)
    const sort = options.sort ?? (await askNumber('排序权重（多个启用时数值小者优先）'))

    const setting = await this.captchaService.create({ provider, config, sort })
    console.log('已添加验证码配置:')
    printDetail(setting)
  }

  @Option({ flags: '-s, --sort <sort>', description: '排序权重' })
  parseSort(v: string): number {
    return Number(v)
  }
}

@SubCommand({ name: 'update', description: '更新验证码配置（缺参时交互询问）' })
class CaptchaUpdateCommand extends CommandRunner {
  constructor(private readonly captchaService: CaptchaService) {
    super()
  }

  async run(_inputs: string[], options: UpdateOptions): Promise<void> {
    const target = options.id
      ? await this.pickById(options.id)
      : await pickCaptcha(this.captchaService)

    // 命令行指定字段时只改这些字段；否则进入交互补全（含服务商配置）
    const changes = this.hasFlag(options)
      ? this.fromFlags(options)
      : await this.fromPrompts(target)

    const setting = await this.captchaService.update(target.id, changes)
    console.log('已更新验证码配置:')
    printDetail(setting)
  }

  private async pickById(id: string): Promise<CaptchaSetting> {
    const list = await this.captchaService.findAll()
    const found = list.find((c) => c.id === id)
    if (!found) throw new Error(`验证码配置不存在: ${id}`)
    return found
  }

  private hasFlag(o: UpdateOptions): boolean {
    return o.sort !== undefined || o.enabled !== undefined
  }

  private fromFlags(o: UpdateOptions): { sort?: number; enabled?: boolean } {
    return { sort: o.sort, enabled: o.enabled }
  }

  private async fromPrompts(
    target: CaptchaSetting,
  ): Promise<{ sort: number; enabled: boolean; config: Record<string, string> }> {
    const sort = await askNumber('排序权重（多个启用时数值小者优先）')
    const enabled = await askSelect<boolean>('状态', [
      { title: '启用', value: true },
      { title: '停用', value: false },
    ])
    const config = await promptConfig(getCaptchaProviderDef(target.provider), target.config)
    return { sort, enabled, config }
  }

  @Option({ flags: '-i, --id <id>', description: '验证码配置 ID' })
  parseId(v: string): string {
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

@SubCommand({ name: 'remove', description: '删除验证码配置' })
class CaptchaRemoveCommand extends CommandRunner {
  constructor(private readonly captchaService: CaptchaService) {
    super()
  }

  async run(_inputs: string[], options: RemoveOptions): Promise<void> {
    const target = options.id
      ? await this.pickById(options.id)
      : await pickCaptcha(this.captchaService)
    if (!(await askConfirm(`确认删除验证码配置 ${getCaptchaProviderDef(target.provider).label}?`))) {
      return
    }

    await this.captchaService.remove(target.id)
    console.log(`已删除验证码配置: ${target.id}`)
  }

  private async pickById(id: string): Promise<CaptchaSetting> {
    const list = await this.captchaService.findAll()
    const found = list.find((c) => c.id === id)
    if (!found) throw new Error(`验证码配置不存在: ${id}`)
    return found
  }

  @Option({ flags: '-i, --id <id>', description: '验证码配置 ID' })
  parseId(v: string): string {
    return v
  }
}

@SubCommand({ name: 'list', description: '列出所有验证码配置及参数' })
class CaptchaListCommand extends CommandRunner {
  constructor(private readonly captchaService: CaptchaService) {
    super()
  }

  async run(): Promise<void> {
    const list = await this.captchaService.findAll()
    for (const c of list) {
      printDetail(c)
    }
  }
}

@Command({
  name: 'captcha',
  description: '验证码配置管理',
  subCommands: [CaptchaAddCommand, CaptchaUpdateCommand, CaptchaRemoveCommand, CaptchaListCommand],
})
export class CaptchaCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: captcha <add|update|remove|list>')
  }
}

export const captchaCommandProviders = [
  CaptchaCommand,
  CaptchaAddCommand,
  CaptchaUpdateCommand,
  CaptchaRemoveCommand,
  CaptchaListCommand,
]

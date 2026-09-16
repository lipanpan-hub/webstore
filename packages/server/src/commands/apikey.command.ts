import { Command, CommandRunner, SubCommand } from 'nest-commander'
import type { ApiKeyInfo } from '@webstore/shared'
import { ApiKeyService } from '../apikey/api-key.service.js'
import { ADMIN_SCOPES, WILDCARD_ALL } from '../apikey/api-key.scope.js'
import { askText, askSelect, askMultiSelect, askConfirm, pickFuzzy } from './interactive.js'

//#region 公共工具
// 将注册表展开为多选项：全局通配 → 各资源通配 → 各具体动作；checked 用于更新时回填当前权限
function buildScopeChoices(current: string[] = []): { title: string; value: string; checked?: boolean }[] {
  const options: { title: string; value: string; checked?: boolean }[] = [
    { title: '*  (全部权限，超级 key)', value: WILDCARD_ALL, checked: current.includes(WILDCARD_ALL) },
  ]
  for (const res of ADMIN_SCOPES) {
    const wildcard = `${res.resource}:*`
    options.push({
      title: `${res.label} - 全部 (${wildcard})`,
      value: wildcard,
      checked: current.includes(wildcard),
    })
    for (const action of res.actions) {
      options.push({
        title: `  ${res.label} - ${action.label} (${action.scope})`,
        value: action.scope,
        checked: current.includes(action.scope),
      })
    }
  }
  return options
}

async function pickApiKey(service: ApiKeyService): Promise<ApiKeyInfo> {
  const list = await service.findAll()
  if (list.length === 0) throw new Error('暂无 API Key，请先执行 apikey add')
  return pickFuzzy(
    '选择 API Key',
    list,
    (k) => `${k.name}  ${k.prefix}...  [${k.enabled ? '启用' : '停用'}]  (${k.id})`,
  )
}

function printApiKey(k: ApiKeyInfo): void {
  const created = k.createdAt ? new Date(k.createdAt).toLocaleString() : '-'
  const lastUsed = k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '从未使用'
  console.log(`${k.id}  ${k.name}  ${k.prefix}...  [${k.enabled ? '启用' : '停用'}]`)
  console.log(`    权限: ${k.scopes.join(', ')}`)
  console.log(`    创建: ${created}    最近使用: ${lastUsed}`)
}
//#endregion

@SubCommand({ name: 'add', description: '新建 API Key 并勾选权限（明文仅显示一次）' })
class ApiKeyAddCommand extends CommandRunner {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super()
  }

  async run(): Promise<void> {
    const name = await askText('备注名称')
    const scopes = await askMultiSelect('勾选授予的权限（空格选中，回车确认）', buildScopeChoices())
    if (scopes.length === 0) throw new Error('至少需要勾选一项权限')

    const created = await this.apiKeyService.create(name, scopes)
    console.log('已创建 API Key，请立即保存以下明文，它只会显示这一次：')
    console.log(`\n    ${created.key}\n`)
    printApiKey(created)
  }
}

@SubCommand({ name: 'list', description: '列出所有 API Key' })
class ApiKeyListCommand extends CommandRunner {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super()
  }

  async run(): Promise<void> {
    const list = await this.apiKeyService.findAll()
    if (list.length === 0) {
      console.log('暂无 API Key')
      return
    }
    for (const k of list) printApiKey(k)
  }
}

@SubCommand({ name: 'update', description: '修改 API Key 的权限或启停状态' })
class ApiKeyUpdateCommand extends CommandRunner {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickApiKey(this.apiKeyService)
    const action = await askSelect<'scopes' | 'enable' | 'disable'>('要修改什么', [
      { title: '重新设置权限', value: 'scopes' },
      { title: '启用', value: 'enable' },
      { title: '停用', value: 'disable' },
    ])

    // 依选择分派：改权限走多选回填，启停直接切换 enabled
    if (action === 'scopes') {
      const scopes = await askMultiSelect(
        '勾选授予的权限（空格选中，回车确认）',
        buildScopeChoices(target.scopes),
      )
      if (scopes.length === 0) throw new Error('至少需要勾选一项权限')
      const updated = await this.apiKeyService.update(target.id, { scopes })
      console.log('已更新权限:')
      printApiKey(updated)
      return
    }

    const updated = await this.apiKeyService.update(target.id, { enabled: action === 'enable' })
    console.log(`已${action === 'enable' ? '启用' : '停用'} API Key:`)
    printApiKey(updated)
  }
}

@SubCommand({ name: 'remove', description: '删除 API Key' })
class ApiKeyRemoveCommand extends CommandRunner {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickApiKey(this.apiKeyService)
    if (!(await askConfirm(`确认删除 API Key ${target.name}（${target.prefix}...）?`))) return

    await this.apiKeyService.remove(target.id)
    console.log(`已删除 API Key: ${target.id}`)
  }
}

@Command({
  name: 'apikey',
  description: 'API Key 管理',
  subCommands: [ApiKeyAddCommand, ApiKeyListCommand, ApiKeyUpdateCommand, ApiKeyRemoveCommand],
})
export class ApiKeyCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: apikey <add|list|update|remove>')
  }
}

export const apiKeyCommandProviders = [
  ApiKeyCommand,
  ApiKeyAddCommand,
  ApiKeyListCommand,
  ApiKeyUpdateCommand,
  ApiKeyRemoveCommand,
]

import { Command, CommandRunner, SubCommand } from 'nest-commander'
import type { ApiKeyInfo, Role } from '@webstore/shared'
import { ApiKeyService } from '../apikey/api-key.service.js'
import { RoleService } from '../role/role.service.js'
import { askText, askMultiSelect, askConfirm, pickFuzzy } from './interactive.js'

//#region 公共工具
// 将角色列表展开为多选项；checked 用于更新时回填当前已绑定角色
function buildRoleChoices(
  roles: Role[],
  current: string[] = [],
): { title: string; value: string; checked?: boolean }[] {
  return roles.map((r) => ({
    title: `${r.name}${r.description ? ` - ${r.description}` : ''}  (${r.scopes.join(', ')})`,
    value: r.id,
    checked: current.includes(r.id),
  }))
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
  const roleNames = k.roles.length > 0 ? k.roles.map((r) => r.name).join(', ') : '（无）'
  const scopes = k.scopes.length > 0 ? k.scopes.join(', ') : '（无有效权限）'
  console.log(`${k.id}  ${k.name}  ${k.prefix}...  [${k.enabled ? '启用' : '停用'}]`)
  console.log(`    角色: ${roleNames}`)
  console.log(`    有效权限: ${scopes}`)
  console.log(`    创建: ${created}    最近使用: ${lastUsed}`)
}
//#endregion

@SubCommand({ name: 'add', description: '新建 API Key 并绑定角色（明文仅显示一次）' })
class ApiKeyAddCommand extends CommandRunner {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly roleService: RoleService,
  ) {
    super()
  }

  async run(): Promise<void> {
    const name = await askText('备注名称')
    const roles = await this.roleService.findAll()
    if (roles.length === 0) throw new Error('暂无角色，请先执行 role add')
    const roleIds = await askMultiSelect('绑定角色（空格选中，回车确认）', buildRoleChoices(roles))
    if (roleIds.length === 0) throw new Error('至少需要绑定一个角色')

    const created = await this.apiKeyService.create(name, roleIds)
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

@SubCommand({ name: 'update', description: '重新设置 API Key 绑定的角色' })
class ApiKeyUpdateCommand extends CommandRunner {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly roleService: RoleService,
  ) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickApiKey(this.apiKeyService)
    const roles = await this.roleService.findAll()
    if (roles.length === 0) throw new Error('暂无角色，请先执行 role add')
    const currentIds = target.roles.map((r) => r.id)
    const roleIds = await askMultiSelect(
      '绑定角色（空格选中，回车确认）',
      buildRoleChoices(roles, currentIds),
    )
    if (roleIds.length === 0) throw new Error('至少需要绑定一个角色')

    const updated = await this.apiKeyService.update(target.id, { roleIds })
    console.log('已更新绑定角色:')
    printApiKey(updated)
  }
}

@SubCommand({ name: 'enable', description: '启用 API Key' })
class ApiKeyEnableCommand extends CommandRunner {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickApiKey(this.apiKeyService)
    const updated = await this.apiKeyService.update(target.id, { enabled: true })
    console.log('已启用 API Key:')
    printApiKey(updated)
  }
}

@SubCommand({ name: 'disable', description: '停用 API Key' })
class ApiKeyDisableCommand extends CommandRunner {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickApiKey(this.apiKeyService)
    const updated = await this.apiKeyService.update(target.id, { enabled: false })
    console.log('已停用 API Key:')
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
  subCommands: [
    ApiKeyAddCommand,
    ApiKeyListCommand,
    ApiKeyUpdateCommand,
    ApiKeyEnableCommand,
    ApiKeyDisableCommand,
    ApiKeyRemoveCommand,
  ],
})
export class ApiKeyCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: apikey <add|list|update|enable|disable|remove>')
  }
}

export const apiKeyCommandProviders = [
  ApiKeyCommand,
  ApiKeyAddCommand,
  ApiKeyListCommand,
  ApiKeyUpdateCommand,
  ApiKeyEnableCommand,
  ApiKeyDisableCommand,
  ApiKeyRemoveCommand,
]

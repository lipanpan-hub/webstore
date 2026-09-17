import { Command, CommandRunner, SubCommand } from 'nest-commander'
import type { Role } from '@webstore/shared'
import { RoleService } from '../role/role.service.js'
import { ApiKeyService } from '../apikey/api-key.service.js'
import { ADMIN_SCOPES, WILDCARD_ALL } from '../apikey/api-key.scope.js'
import { askText, askOptionalText, askMultiSelect, askConfirm, pickFuzzy } from './interactive.js'

//#region 公共工具
// 将 scope 注册表展开为多选项：全局通配 → 各资源通配 → 各具体动作；checked 用于更新时回填
function buildScopeChoices(current: string[] = []): { title: string; value: string; checked?: boolean }[] {
  const options: { title: string; value: string; checked?: boolean }[] = [
    { title: '*  (全部权限，超级角色)', value: WILDCARD_ALL, checked: current.includes(WILDCARD_ALL) },
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

async function pickRole(service: RoleService): Promise<Role> {
  const list = await service.findAll()
  if (list.length === 0) throw new Error('暂无角色，请先执行 role add')
  return pickFuzzy('选择角色', list, (r) => `${r.name}  [${r.scopes.length} 项权限]  (${r.id})`)
}

function printRole(r: Role): void {
  const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'
  console.log(`${r.id}  ${r.name}${r.description ? `  - ${r.description}` : ''}`)
  console.log(`    权限: ${r.scopes.join(', ')}`)
  console.log(`    创建: ${created}`)
}
//#endregion

@SubCommand({ name: 'add', description: '新建角色并勾选其权限' })
class RoleAddCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(): Promise<void> {
    const name = await askText('角色名称')
    const description = await askOptionalText('角色说明（可留空）')
    const scopes = await askMultiSelect('勾选该角色的权限（空格选中，回车确认）', buildScopeChoices())
    if (scopes.length === 0) throw new Error('角色至少需要勾选一项权限')

    const role = await this.roleService.create(name, scopes, description || undefined)
    console.log('已创建角色:')
    printRole(role)
  }
}

@SubCommand({ name: 'list', description: '列出所有角色' })
class RoleListCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(): Promise<void> {
    const list = await this.roleService.findAll()
    if (list.length === 0) {
      console.log('暂无角色')
      return
    }
    for (const r of list) printRole(r)
  }
}

@SubCommand({ name: 'update', description: '修改角色的名称、说明与权限' })
class RoleUpdateCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickRole(this.roleService)
    const name = await askText('角色名称', target.name)
    const description = await askOptionalText('角色说明（可留空）', target.description ?? '')
    const scopes = await askMultiSelect(
      '勾选该角色的权限（空格选中，回车确认）',
      buildScopeChoices(target.scopes),
    )
    if (scopes.length === 0) throw new Error('角色至少需要勾选一项权限')

    const updated = await this.roleService.update(target.id, { name, description, scopes })
    console.log('已更新角色:')
    printRole(updated)
  }
}

@SubCommand({ name: 'remove', description: '删除角色（被 API Key 引用时禁止删除）' })
class RoleRemoveCommand extends CommandRunner {
  constructor(
    private readonly roleService: RoleService,
    private readonly apiKeyService: ApiKeyService,
  ) {
    super()
  }

  async run(): Promise<void> {
    const target = await pickRole(this.roleService)
    // 引用完整性检查放在命令层：同时依赖两个 Service，避免 Role 与 ApiKey 循环依赖
    const referenced = await this.apiKeyService.countByRole(target.id)
    if (referenced > 0) {
      throw new Error(`该角色仍被 ${referenced} 个 API Key 引用，请先解绑后再删除`)
    }
    if (!(await askConfirm(`确认删除角色 ${target.name}?`))) return

    await this.roleService.remove(target.id)
    console.log(`已删除角色: ${target.id}`)
  }
}

@Command({
  name: 'role',
  description: '角色管理',
  subCommands: [RoleAddCommand, RoleListCommand, RoleUpdateCommand, RoleRemoveCommand],
})
export class RoleCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: role <add|list|update|remove>')
  }
}

export const roleCommandProviders = [
  RoleCommand,
  RoleAddCommand,
  RoleListCommand,
  RoleUpdateCommand,
  RoleRemoveCommand,
]

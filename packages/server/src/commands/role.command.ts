import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import { RoleService } from '../role/role.service.js'
import { askText, askOptionalText, askConfirm } from './interactive.js'
import { ALL_PERMISSIONS } from '../auth/permissions.js'

interface AddOptions {
  name?: string
  description?: string
  permissions?: string[]
}

interface GrantOptions {
  name?: string
  permissions?: string[]
}

interface RemoveOptions {
  name?: string
}

//#region 公共工具
function parsePermissionList(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
//#endregion

@SubCommand({ name: 'list', description: '列出所有角色及其权限点' })
class RoleListCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(): Promise<void> {
    const roles = await this.roleService.findAll()
    console.log(`可用权限点: ${ALL_PERMISSIONS.join(', ')}  (* 表示全部)`)
    for (const r of roles) {
      console.log(`${r.name}  <${r.description}>  权限=[${r.permissions.join(', ')}]`)
    }
  }
}

@SubCommand({ name: 'add', description: '新增角色（缺参时交互询问）' })
class RoleAddCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(_inputs: string[], options: AddOptions): Promise<void> {
    const name = options.name ?? (await askText('角色名'))
    const description = options.description ?? (await askOptionalText('角色描述（可选）'))
    const permissions =
      options.permissions ?? parsePermissionList(await askText('权限点（逗号分隔，* 表示全部）'))
    const role = await this.roleService.create(name, description, permissions)
    console.log(`已创建角色 ${role.name}  权限=[${role.permissions.join(', ')}]`)
  }

  @Option({ flags: '-n, --name <name>', description: '角色名' })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-d, --description <description>', description: '角色描述' })
  parseDescription(v: string): string {
    return v
  }

  @Option({ flags: '-p, --permissions <permissions>', description: '权限点，逗号分隔' })
  parsePermissions(v: string): string[] {
    return parsePermissionList(v)
  }
}

@SubCommand({ name: 'grant', description: '给角色追加权限点（缺参时交互询问）' })
class RoleGrantCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(_inputs: string[], options: GrantOptions): Promise<void> {
    const name = options.name ?? (await askText('角色名'))
    const permissions =
      options.permissions ?? parsePermissionList(await askText('要追加的权限点（逗号分隔）'))
    const role = await this.roleService.grant(name, permissions)
    console.log(`已更新角色 ${role.name}  权限=[${role.permissions.join(', ')}]`)
  }

  @Option({ flags: '-n, --name <name>', description: '角色名' })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-p, --permissions <permissions>', description: '权限点，逗号分隔' })
  parsePermissions(v: string): string[] {
    return parsePermissionList(v)
  }
}

@SubCommand({ name: 'revoke', description: '撤销角色的权限点（缺参时交互询问）' })
class RoleRevokeCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(_inputs: string[], options: GrantOptions): Promise<void> {
    const name = options.name ?? (await askText('角色名'))
    const permissions =
      options.permissions ?? parsePermissionList(await askText('要撤销的权限点（逗号分隔）'))
    const role = await this.roleService.revoke(name, permissions)
    console.log(`已更新角色 ${role.name}  权限=[${role.permissions.join(', ')}]`)
  }

  @Option({ flags: '-n, --name <name>', description: '角色名' })
  parseName(v: string): string {
    return v
  }

  @Option({ flags: '-p, --permissions <permissions>', description: '权限点，逗号分隔' })
  parsePermissions(v: string): string[] {
    return parsePermissionList(v)
  }
}

@SubCommand({ name: 'remove', description: '删除角色' })
class RoleRemoveCommand extends CommandRunner {
  constructor(private readonly roleService: RoleService) {
    super()
  }

  async run(_inputs: string[], options: RemoveOptions): Promise<void> {
    const name = options.name ?? (await askText('角色名'))
    if (!(await askConfirm(`确认删除角色 ${name}?`))) return
    await this.roleService.remove(name)
    console.log(`已删除角色: ${name}`)
  }

  @Option({ flags: '-n, --name <name>', description: '角色名' })
  parseName(v: string): string {
    return v
  }
}

@Command({
  name: 'role',
  description: '角色与权限管理',
  subCommands: [RoleListCommand, RoleAddCommand, RoleGrantCommand, RoleRevokeCommand, RoleRemoveCommand],
})
export class RoleCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: role <list|add|grant|revoke|remove>')
  }
}

export const roleCommandProviders = [
  RoleCommand,
  RoleListCommand,
  RoleAddCommand,
  RoleGrantCommand,
  RoleRevokeCommand,
  RoleRemoveCommand,
]

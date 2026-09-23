import { Command, CommandRunner, Option, SubCommand } from 'nest-commander'
import { UserService } from '../user/user.service.js'
import { askText } from './interactive.js'

interface CreateOptions {
  username?: string
  password?: string
  roles?: string[]
}

interface RolesOptions {
  username?: string
  roles?: string[]
}

interface PasswdOptions {
  username?: string
  password?: string
}

//#region 公共工具
function parseRoleList(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
//#endregion

@SubCommand({ name: 'create', description: '创建用户（缺参时交互询问，缺省赋予基础角色 user）' })
class UserCreateCommand extends CommandRunner {
  constructor(private readonly userService: UserService) {
    super()
  }

  async run(_inputs: string[], options: CreateOptions): Promise<void> {
    const username = options.username ?? (await askText('用户名'))
    const password = options.password ?? (await askText('密码'))
    // roles 未传则交由 service 使用默认基础角色
    const user = await this.userService.create({ username, password, roles: options.roles })
    console.log(`已创建用户: ${user.username}  角色=[${user.roles.join(', ')}]`)
  }

  @Option({ flags: '-u, --username <username>', description: '用户名' })
  parseUsername(v: string): string {
    return v
  }

  @Option({ flags: '-p, --password <password>', description: '密码' })
  parsePassword(v: string): string {
    return v
  }

  @Option({ flags: '-r, --roles <roles>', description: '角色名，逗号分隔（缺省为 user）' })
  parseRoles(v: string): string[] {
    return parseRoleList(v)
  }
}

@SubCommand({ name: 'list', description: '列出所有用户及其角色与权限' })
class UserListCommand extends CommandRunner {
  constructor(private readonly userService: UserService) {
    super()
  }

  async run(): Promise<void> {
    const users = await this.userService.findAll()
    for (const u of users) {
      console.log(
        `${u.id}  ${u.username}  [${u.status}]  角色=[${u.roles.join(', ')}]  权限=[${u.permissions.join(', ')}]`,
      )
    }
  }
}

@SubCommand({ name: 'setroles', description: '重设用户角色（缺参时交互询问）' })
class UserSetRolesCommand extends CommandRunner {
  constructor(private readonly userService: UserService) {
    super()
  }

  async run(_inputs: string[], options: RolesOptions): Promise<void> {
    const username = options.username ?? (await askText('用户名'))
    const roles = options.roles ?? parseRoleList(await askText('角色名（逗号分隔）'))
    const user = await this.userService.setRoles(username, roles)
    console.log(`已更新用户 ${user.username} 角色=[${user.roles.join(', ')}]`)
  }

  @Option({ flags: '-u, --username <username>', description: '用户名' })
  parseUsername(v: string): string {
    return v
  }

  @Option({ flags: '-r, --roles <roles>', description: '角色名，逗号分隔' })
  parseRoles(v: string): string[] {
    return parseRoleList(v)
  }
}

@SubCommand({ name: 'passwd', description: '重设用户密码（缺参时交互询问）' })
class UserPasswdCommand extends CommandRunner {
  constructor(private readonly userService: UserService) {
    super()
  }

  async run(_inputs: string[], options: PasswdOptions): Promise<void> {
    const username = options.username ?? (await askText('用户名'))
    const password = options.password ?? (await askText('新密码'))
    await this.userService.setPassword(username, password)
    console.log(`已重设用户 ${username} 的密码`)
  }

  @Option({ flags: '-u, --username <username>', description: '用户名' })
  parseUsername(v: string): string {
    return v
  }

  @Option({ flags: '-p, --password <password>', description: '新密码' })
  parsePassword(v: string): string {
    return v
  }
}

@Command({
  name: 'user',
  description: '用户管理',
  subCommands: [UserCreateCommand, UserListCommand, UserSetRolesCommand, UserPasswdCommand],
})
export class UserCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('用法: user <create|list|setroles|passwd>')
  }
}

export const userCommandProviders = [
  UserCommand,
  UserCreateCommand,
  UserListCommand,
  UserSetRolesCommand,
  UserPasswdCommand,
]

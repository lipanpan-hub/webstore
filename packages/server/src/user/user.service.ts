import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { AuthUserView } from '@webstore/shared'
import { UserEntity, UserDocument } from './user.schema.js'
import { hashPassword, verifyPassword } from './password.util.js'
import { RoleService } from '../role/role.service.js'
import { DEFAULT_ROLE_NAME } from '../auth/permissions.js'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>,
    private readonly roleService: RoleService,
  ) {}

  //#region 创建与查询
  async create(input: { username: string; password: string; roles?: string[] }): Promise<AuthUserView> {
    const username = input.username.trim()
    if (!username) throw new BadRequestException('用户名不能为空')
    if (!input.password?.trim()) throw new BadRequestException('密码不能为空')

    const duplicated = await this.userModel.exists({ username })
    if (duplicated) throw new BadRequestException(`用户名已存在: ${username}`)

    // 缺省赋予基础角色；显式指定时校验角色均存在
    const roles = input.roles?.length ? input.roles : [DEFAULT_ROLE_NAME]
    await this.assertRolesExist(roles)

    const doc = await this.userModel.create({
      username,
      passwordHash: hashPassword(input.password),
      roles,
      status: 'active',
    })
    return this.toAuthUser(doc)
  }

  // 供认证：按用户名取原始文档（含密码哈希）
  async findEntityByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.trim() })
  }

  async findAuthUserById(id: string): Promise<AuthUserView> {
    const doc = await this.userModel.findById(id)
    if (!doc) throw new NotFoundException('用户不存在')
    return this.toAuthUser(doc)
  }

  async findAll(): Promise<AuthUserView[]> {
    const docs = await this.userModel.find().lean()
    const views: AuthUserView[] = []
    for (const d of docs) {
      const permissions = await this.roleService.resolvePermissions(d.roles ?? [])
      views.push({
        id: String(d._id),
        username: d.username,
        roles: d.roles ?? [],
        permissions,
        status: d.status,
      })
    }
    return views
  }
  //#endregion

  //#region 修改
  async setRoles(username: string, roles: string[]): Promise<AuthUserView> {
    await this.assertRolesExist(roles)
    const doc = await this.userModel.findOneAndUpdate(
      { username: username.trim() },
      { roles },
      { returnDocument: 'after' },
    )
    if (!doc) throw new NotFoundException(`用户不存在: ${username}`)
    return this.toAuthUser(doc)
  }

  async setPassword(username: string, password: string): Promise<void> {
    if (!password?.trim()) throw new BadRequestException('密码不能为空')
    const doc = await this.userModel.findOneAndUpdate(
      { username: username.trim() },
      { passwordHash: hashPassword(password) },
    )
    if (!doc) throw new NotFoundException(`用户不存在: ${username}`)
  }
  //#endregion

  //#region 认证辅助
  // 校验明文密码是否匹配
  verifyPassword(user: UserDocument, plain: string): boolean {
    return verifyPassword(plain, user.passwordHash)
  }

  // 将用户文档转为登录视图：聚合其角色权限点并集
  async toAuthUser(doc: UserDocument): Promise<AuthUserView> {
    const permissions = await this.roleService.resolvePermissions(doc.roles ?? [])
    return {
      id: String(doc._id),
      username: doc.username,
      roles: doc.roles ?? [],
      permissions,
      status: doc.status,
    }
  }
  //#endregion

  //#region 内部工具
  private async assertRolesExist(roles: string[]): Promise<void> {
    const found = await this.roleService.findByNames(roles)
    const foundNames = new Set(found.map((r) => r.name))
    const missing = roles.filter((name) => !foundNames.has(name))
    if (missing.length > 0) {
      throw new BadRequestException(`角色不存在: ${missing.join(', ')}`)
    }
  }
  //#endregion
}

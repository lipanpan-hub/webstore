import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { Permission, RoleView } from '@webstore/shared'
import { RoleEntity, RoleDocument } from './role.schema.js'
import { BUILTIN_ROLES } from '../auth/permissions.js'

@Injectable()
export class RoleService implements OnModuleInit {
  constructor(
    @InjectModel(RoleEntity.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  //#region 内置角色 seed
  async onModuleInit(): Promise<void> {
    // 系统启动时确保内置角色存在（幂等）：仅在缺失时创建，不覆盖站长已改动的权限
    for (const def of BUILTIN_ROLES) {
      const exists = await this.roleModel.exists({ name: def.name })
      if (!exists) {
        await this.roleModel.create(def)
      }
    }
  }
  //#endregion

  //#region 查询
  async findAll(): Promise<RoleView[]> {
    const docs = await this.roleModel.find().lean()
    return docs.map((d) => this.toViewFromLean(d))
  }

  // 按角色名批量查询，用于校验用户所赋角色是否存在
  async findByNames(names: string[]): Promise<RoleView[]> {
    const docs = await this.roleModel.find({ name: { $in: names } }).lean()
    return docs.map((d) => this.toViewFromLean(d))
  }

  // 聚合多个角色的权限点并集（去重），供登录时写入 JWT
  async resolvePermissions(roleNames: string[]): Promise<Permission[]> {
    if (roleNames.length === 0) return []
    const roles = await this.findByNames(roleNames)
    const merged = new Set<Permission>()
    for (const role of roles) {
      for (const perm of role.permissions) merged.add(perm)
    }
    return [...merged]
  }
  //#endregion

  //#region 管理（供 CLI）
  async create(name: string, description: string, permissions: Permission[]): Promise<RoleView> {
    const exists = await this.roleModel.exists({ name })
    if (exists) throw new BadRequestException(`角色已存在: ${name}`)
    const doc = await this.roleModel.create({ name, description, permissions })
    return this.toView(doc)
  }

  // 追加授予权限点（去重）
  async grant(name: string, permissions: Permission[]): Promise<RoleView> {
    const role = await this.getByName(name)
    const merged = new Set<Permission>([...role.permissions, ...permissions])
    role.permissions = [...merged]
    await role.save()
    return this.toView(role)
  }

  // 撤销权限点
  async revoke(name: string, permissions: Permission[]): Promise<RoleView> {
    const role = await this.getByName(name)
    const removal = new Set<Permission>(permissions)
    role.permissions = role.permissions.filter((p) => !removal.has(p))
    await role.save()
    return this.toView(role)
  }

  async remove(name: string): Promise<void> {
    const doc = await this.roleModel.findOneAndDelete({ name })
    if (!doc) throw new NotFoundException(`角色不存在: ${name}`)
  }
  //#endregion

  //#region 内部工具
  private async getByName(name: string): Promise<RoleDocument> {
    const doc = await this.roleModel.findOne({ name })
    if (!doc) throw new NotFoundException(`角色不存在: ${name}`)
    return doc
  }

  private toView(doc: RoleDocument): RoleView {
    return {
      id: String(doc._id),
      name: doc.name,
      description: doc.description,
      permissions: doc.permissions ?? [],
    }
  }

  private toViewFromLean(d: LeanRole): RoleView {
    return {
      id: String(d._id),
      name: d.name,
      description: d.description,
      permissions: d.permissions ?? [],
    }
  }
  //#endregion
}

interface LeanRole {
  _id: unknown
  name: string
  description: string
  permissions?: Permission[]
}

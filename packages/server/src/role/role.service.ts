import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { ApiKeyScope, Role } from '@webstore/shared'
import { RoleEntity, RoleDocument } from './role.schema.js'
import { isValidScope } from '../apikey/api-key.scope.js'

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(RoleEntity.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  //#region CLI 管理
  async create(name: string, scopes: ApiKeyScope[], description?: string): Promise<Role> {
    const cleaned = this.ensureValidScopes(scopes)
    await this.ensureNameAvailable(name)
    const doc = await this.roleModel.create({ name, scopes: cleaned, description: description ?? '' })
    return this.toInfo(doc)
  }

  async update(
    id: string,
    changes: { name?: string; scopes?: ApiKeyScope[]; description?: string },
  ): Promise<Role> {
    const patch: { name?: string; scopes?: string[]; description?: string } = {}
    if (changes.name !== undefined) {
      await this.ensureNameAvailable(changes.name, id)
      patch.name = changes.name
    }
    if (changes.scopes !== undefined) patch.scopes = this.ensureValidScopes(changes.scopes)
    if (changes.description !== undefined) patch.description = changes.description

    const doc = await this.roleModel.findByIdAndUpdate(id, patch, { returnDocument: 'after' })
    if (!doc) throw new NotFoundException(`角色不存在: ${id}`)
    return this.toInfo(doc)
  }

  async remove(id: string): Promise<void> {
    const doc = await this.roleModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundException(`角色不存在: ${id}`)
  }

  async findAll(): Promise<Role[]> {
    const docs = await this.roleModel.find().sort({ createdAt: 1 }).lean()
    return docs.map((d) => this.toInfoFromLean(d))
  }
  //#endregion

  //#region 权限解析
  // 按 id 批量取角色，供 ApiKeyService 解析有效权限；忽略已不存在的 id
  async findByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return []
    const docs = await this.roleModel.find({ _id: { $in: ids } }).lean()
    return docs.map((d) => this.toInfoFromLean(d))
  }
  //#endregion

  //#region 内部工具
  private ensureValidScopes(scopes: ApiKeyScope[]): ApiKeyScope[] {
    const unique = Array.from(new Set(scopes))
    const invalid = unique.filter((s) => !isValidScope(s))
    if (invalid.length > 0) throw new BadRequestException(`存在非法权限: ${invalid.join(', ')}`)
    if (unique.length === 0) throw new BadRequestException('角色至少需要包含一项权限')
    return unique
  }

  // 校验角色名唯一；更新时排除自身
  private async ensureNameAvailable(name: string, excludeId?: string): Promise<void> {
    const existing = await this.roleModel.findOne({ name }).lean()
    if (existing && String(existing._id) !== excludeId) {
      throw new ConflictException(`角色名已存在: ${name}`)
    }
  }

  private toInfo(doc: RoleDocument): Role {
    return {
      id: String(doc._id),
      name: doc.name,
      description: doc.description || undefined,
      scopes: doc.scopes ?? [],
      createdAt: doc.createdAt?.getTime() ?? 0,
    }
  }

  private toInfoFromLean(d: LeanRole): Role {
    return {
      id: String(d._id),
      name: d.name,
      description: d.description || undefined,
      scopes: d.scopes ?? [],
      createdAt: d.createdAt?.getTime() ?? 0,
    }
  }
  //#endregion
}

interface LeanRole {
  _id: unknown
  name: string
  description?: string
  scopes?: string[]
  createdAt?: Date
}

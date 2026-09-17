import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createHash, randomBytes } from 'node:crypto'
import type { ApiKeyCreated, ApiKeyInfo, Role, RoleRef } from '@webstore/shared'
import { ApiKeyEntity, ApiKeyDocument } from './api-key.schema.js'
import { RoleService } from '../role/role.service.js'

// 明文 key 前缀，便于人工辨识来源
const KEY_PREFIX = 'sk_'
// prefix 明文保留长度（含 sk_ 前缀）
const PREFIX_KEEP = 12

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKeyEntity.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
    private readonly roleService: RoleService,
  ) {}

  //#region CLI 管理
  async create(name: string, roleIds: string[]): Promise<ApiKeyCreated> {
    const cleaned = await this.ensureValidRoles(roleIds)
    // 生成高熵随机 key，仅此一次返回明文，库中只保存其哈希
    const key = `${KEY_PREFIX}${randomBytes(24).toString('hex')}`
    const doc = await this.apiKeyModel.create({
      name,
      keyHash: this.hashKey(key),
      prefix: key.slice(0, PREFIX_KEEP),
      roleIds: cleaned,
      enabled: true,
    })
    return { ...(await this.toInfo(doc)), key }
  }

  async update(
    id: string,
    changes: { roleIds?: string[]; enabled?: boolean },
  ): Promise<ApiKeyInfo> {
    const patch: { roleIds?: string[]; enabled?: boolean } = {}
    if (changes.roleIds !== undefined) patch.roleIds = await this.ensureValidRoles(changes.roleIds)
    if (changes.enabled !== undefined) patch.enabled = changes.enabled

    const doc = await this.apiKeyModel.findByIdAndUpdate(id, patch, { returnDocument: 'after' })
    if (!doc) throw new NotFoundException(`API Key 不存在: ${id}`)
    return this.toInfo(doc)
  }

  async remove(id: string): Promise<void> {
    const doc = await this.apiKeyModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundException(`API Key 不存在: ${id}`)
  }

  async findAll(): Promise<ApiKeyInfo[]> {
    const docs = await this.apiKeyModel.find().sort({ createdAt: 1 }).lean()
    return Promise.all(docs.map((d) => this.toInfoFromLean(d)))
  }

  // 统计引用了某角色的 key 数量，供 CLI 删除角色前做引用完整性检查
  async countByRole(roleId: string): Promise<number> {
    return this.apiKeyModel.countDocuments({ roleIds: roleId })
  }
  //#endregion

  //#region 认证校验
  // 校验明文 key：命中且启用则返回其信息（含解析后的 scopes），否则返回 null
  async verify(rawKey: string): Promise<ApiKeyInfo | null> {
    if (!rawKey) return null
    const doc = await this.apiKeyModel.findOne({ keyHash: this.hashKey(rawKey) })
    if (!doc || !doc.enabled) return null
    // 记录最近使用时间，失败不影响鉴权主流程
    this.apiKeyModel.updateOne({ _id: doc._id }, { lastUsedAt: new Date() }).catch(() => {})
    return this.toInfo(doc)
  }
  //#endregion

  //#region 内部工具
  // 校验角色 id 均存在，返回去重后的 id 集合
  private async ensureValidRoles(roleIds: string[]): Promise<string[]> {
    const unique = Array.from(new Set(roleIds))
    if (unique.length === 0) throw new BadRequestException('至少需要绑定一个角色')
    const found = await this.roleService.findByIds(unique)
    const foundIds = new Set(found.map((r) => r.id))
    const missing = unique.filter((id) => !foundIds.has(id))
    if (missing.length > 0) throw new BadRequestException(`存在不存在的角色: ${missing.join(', ')}`)
    return unique
  }

  // 把角色列表聚合为引用视图与有效 scope 并集
  private aggregate(roles: Role[]): { refs: RoleRef[]; scopes: string[] } {
    const refs = roles.map((r) => ({ id: r.id, name: r.name }))
    const scopes = Array.from(new Set(roles.flatMap((r) => r.scopes)))
    return { refs, scopes }
  }

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex')
  }

  private async toInfo(doc: ApiKeyDocument): Promise<ApiKeyInfo> {
    const roles = await this.roleService.findByIds(doc.roleIds ?? [])
    const { refs, scopes } = this.aggregate(roles)
    return {
      id: String(doc._id),
      name: doc.name,
      prefix: doc.prefix,
      roles: refs,
      scopes,
      enabled: doc.enabled,
      createdAt: doc.createdAt?.getTime() ?? 0,
      lastUsedAt: doc.lastUsedAt?.getTime(),
    }
  }

  private async toInfoFromLean(d: LeanApiKey): Promise<ApiKeyInfo> {
    const roles = await this.roleService.findByIds(d.roleIds ?? [])
    const { refs, scopes } = this.aggregate(roles)
    return {
      id: String(d._id),
      name: d.name,
      prefix: d.prefix,
      roles: refs,
      scopes,
      enabled: d.enabled,
      createdAt: d.createdAt?.getTime() ?? 0,
      lastUsedAt: d.lastUsedAt?.getTime(),
    }
  }
  //#endregion
}

interface LeanApiKey {
  _id: unknown
  name: string
  prefix: string
  roleIds?: string[]
  enabled: boolean
  createdAt?: Date
  lastUsedAt?: Date
}

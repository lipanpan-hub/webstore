import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createHash, randomBytes } from 'node:crypto'
import type { ApiKeyCreated, ApiKeyInfo, ApiKeyScope } from '@webstore/shared'
import { ApiKeyEntity, ApiKeyDocument } from './api-key.schema.js'
import { isValidScope } from './api-key.scope.js'

// 明文 key 前缀，便于人工辨识来源
const KEY_PREFIX = 'sk_'
// prefix 明文保留长度（含 sk_ 前缀）
const PREFIX_KEEP = 12

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKeyEntity.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  //#region CLI 管理
  async create(name: string, scopes: ApiKeyScope[]): Promise<ApiKeyCreated> {
    const cleaned = this.ensureValidScopes(scopes)
    // 生成高熵随机 key，仅此一次返回明文，库中只保存其哈希
    const key = `${KEY_PREFIX}${randomBytes(24).toString('hex')}`
    const doc = await this.apiKeyModel.create({
      name,
      keyHash: this.hashKey(key),
      prefix: key.slice(0, PREFIX_KEEP),
      scopes: cleaned,
      enabled: true,
    })
    return { ...this.toInfo(doc), key }
  }

  async update(
    id: string,
    changes: { scopes?: ApiKeyScope[]; enabled?: boolean },
  ): Promise<ApiKeyInfo> {
    const patch: { scopes?: string[]; enabled?: boolean } = {}
    if (changes.scopes !== undefined) patch.scopes = this.ensureValidScopes(changes.scopes)
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
    return docs.map((d) => this.toInfoFromLean(d))
  }
  //#endregion

  //#region 认证校验
  // 校验明文 key：命中且启用则返回其信息（含 scopes），否则返回 null
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
  private ensureValidScopes(scopes: ApiKeyScope[]): ApiKeyScope[] {
    const unique = Array.from(new Set(scopes))
    const invalid = unique.filter((s) => !isValidScope(s))
    if (invalid.length > 0) throw new BadRequestException(`存在非法权限: ${invalid.join(', ')}`)
    if (unique.length === 0) throw new BadRequestException('至少需要授予一项权限')
    return unique
  }

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex')
  }

  private toInfo(doc: ApiKeyDocument): ApiKeyInfo {
    return {
      id: String(doc._id),
      name: doc.name,
      prefix: doc.prefix,
      scopes: doc.scopes ?? [],
      enabled: doc.enabled,
      createdAt: doc.createdAt?.getTime() ?? 0,
      lastUsedAt: doc.lastUsedAt?.getTime(),
    }
  }

  private toInfoFromLean(d: LeanApiKey): ApiKeyInfo {
    return {
      id: String(d._id),
      name: d.name,
      prefix: d.prefix,
      scopes: d.scopes ?? [],
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
  scopes?: string[]
  enabled: boolean
  createdAt?: Date
  lastUsedAt?: Date
}

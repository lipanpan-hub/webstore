import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ApiKeyCreated, ApiKeyInfo, Role, RoleRef } from '@webstore/shared'
import { ApiKeyEntity, ApiKeyDocument } from './api-key.schema.js'
import { RoleService } from '../role/role.service.js'
import { SecretCipher } from './api-key.cipher.js'
import { TIMESTAMP_WINDOW_SECONDS } from './api-key.signature.js'

// keyId 公开前缀，便于人工辨识来源
const KEY_ID_PREFIX = 'ak_'
// secret 明文前缀
const SECRET_PREFIX = 'sk_'

// 验签所需的请求要素集合
export interface SignatureInput {
  keyId: string
  timestamp: string
  nonce: string
  signature: string
  // 由协议模块按固定约定组装好的待签名字符串
  canonicalString: string
}

@Injectable()
export class ApiKeyService {
  // nonce 去重表：nonce -> 过期时间(Unix 秒)。单实例内存足够发卡站使用，
  // 重启后清空但不影响安全——时间窗口本身已限制重放的有效期。
  private readonly usedNonces = new Map<string, number>()

  constructor(
    @InjectModel(ApiKeyEntity.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
    private readonly roleService: RoleService,
    private readonly cipher: SecretCipher,
  ) {}

  //#region CLI 管理
  async create(name: string, roleIds: string[]): Promise<ApiKeyCreated> {
    const cleaned = await this.ensureValidRoles(roleIds)
    // 生成公开标识与高熵签名密钥；secret 仅此一次返回明文，库中只存其 AES-GCM 密文
    const keyId = `${KEY_ID_PREFIX}${randomBytes(8).toString('hex')}`
    const secret = `${SECRET_PREFIX}${randomBytes(32).toString('hex')}`
    const doc = await this.apiKeyModel.create({
      name,
      keyId,
      secretEnc: this.cipher.encrypt(secret),
      roleIds: cleaned,
      enabled: true,
    })
    return { ...(await this.toInfo(doc)), secret }
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

  //#region 认证校验（HMAC 验签）
  // 校验请求签名：依次做 keyId 定位、时间窗口、HMAC 比对、nonce 去重，全部通过才返回其信息
  async verifySignature(input: SignatureInput): Promise<ApiKeyInfo> {
    const doc = await this.apiKeyModel.findOne({ keyId: input.keyId })
    if (!doc || !doc.enabled) throw new UnauthorizedException('API Key 无效或已停用')

    this.ensureFreshTimestamp(input.timestamp)

    // 解出 secret 重算签名，与客户端签名做恒定时间比对，防时序侧信道
    const secret = this.cipher.decrypt(doc.secretEnc)
    const expected = createHmac('sha256', secret).update(input.canonicalString).digest('hex')
    if (!this.safeEqualHex(expected, input.signature)) {
      throw new UnauthorizedException('签名校验失败')
    }

    // 验签通过后再登记 nonce，避免无效请求污染去重表
    this.ensureUnusedNonce(input.nonce, input.timestamp)

    // 记录最近使用时间，失败不影响鉴权主流程
    this.apiKeyModel.updateOne({ _id: doc._id }, { lastUsedAt: new Date() }).catch(() => {})
    return this.toInfo(doc)
  }
  //#endregion

  //#region 验签内部工具
  // 校验时间戳落在允许的时钟偏移窗口内
  private ensureFreshTimestamp(timestamp: string): void {
    const ts = Number(timestamp)
    if (!Number.isFinite(ts)) throw new UnauthorizedException('时间戳非法')
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - ts) > TIMESTAMP_WINDOW_SECONDS) {
      throw new UnauthorizedException('请求已过期')
    }
  }

  // 校验 nonce 未在窗口内使用过，通过则登记；顺带清理已过期条目
  private ensureUnusedNonce(nonce: string, timestamp: string): void {
    if (!nonce) throw new UnauthorizedException('缺少 nonce')
    const now = Math.floor(Date.now() / 1000)
    for (const [used, expireAt] of this.usedNonces) {
      if (expireAt <= now) this.usedNonces.delete(used)
    }
    if (this.usedNonces.has(nonce)) throw new UnauthorizedException('检测到重放请求')
    // nonce 有效期取时间戳加一个窗口，覆盖其可被接受的整个存活期
    this.usedNonces.set(nonce, Number(timestamp) + TIMESTAMP_WINDOW_SECONDS)
  }

  // 恒定时间比较两个 hex 字符串，长度不同直接判否
  private safeEqualHex(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
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

  private async toInfo(doc: ApiKeyDocument): Promise<ApiKeyInfo> {
    const roles = await this.roleService.findByIds(doc.roleIds ?? [])
    const { refs, scopes } = this.aggregate(roles)
    return {
      id: String(doc._id),
      name: doc.name,
      keyId: doc.keyId,
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
      keyId: d.keyId,
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
  keyId: string
  roleIds?: string[]
  enabled: boolean
  createdAt?: Date
  lastUsedAt?: Date
}

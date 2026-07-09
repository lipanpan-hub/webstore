import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { CaptchaConfigView, CaptchaProvider, CaptchaSetting } from '@webstore/shared'
import { CaptchaSettingEntity, CaptchaSettingDocument } from './captcha.schema.js'
import { pickPublicParams } from './captcha.provider.js'
import { CaptchaVerifierFactory } from './verifier/captcha-verifier.factory.js'

@Injectable()
export class CaptchaService {
  constructor(
    @InjectModel(CaptchaSettingEntity.name)
    private readonly captchaModel: Model<CaptchaSettingDocument>,
    private readonly verifierFactory: CaptchaVerifierFactory,
  ) {}

  //#region CLI 管理
  async create(data: {
    provider: CaptchaProvider
    config: Record<string, string>
    sort?: number
  }): Promise<CaptchaSetting> {
    const doc = await this.captchaModel.create({ ...data, sort: data.sort ?? 0, enabled: true })
    return this.toSetting(doc)
  }

  async update(
    id: string,
    changes: { sort?: number; enabled?: boolean; config?: Record<string, string> },
  ): Promise<CaptchaSetting> {
    const doc = await this.captchaModel.findByIdAndUpdate(id, changes, { returnDocument: 'after' })
    if (!doc) throw new NotFoundException(`验证码配置不存在: ${id}`)
    return this.toSetting(doc)
  }

  async remove(id: string): Promise<void> {
    const doc = await this.captchaModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundException(`验证码配置不存在: ${id}`)
  }

  async findAll(): Promise<CaptchaSetting[]> {
    const docs = await this.captchaModel.find().sort({ sort: 1 }).lean()
    return docs.map((d) => this.toSettingFromLean(d))
  }
  //#endregion

  //#region 前端与下单流程
  async getPublicConfig(): Promise<CaptchaConfigView | null> {
    // 供前端购买表单初始化验证码控件：返回启用中优先级最高的服务商公开参数，无则返回 null
    const active = await this.findActive()
    if (!active) return null
    return { provider: active.provider, params: pickPublicParams(active.provider, active.config) }
  }

  async verify(token: Record<string, string> | undefined): Promise<boolean> {
    // 未启用验证码时直接放行；启用时交由对应服务商校验器核验
    const active = await this.findActive()
    if (!active) return true
    return this.verifierFactory.create(active).verify(token ?? {})
  }

  private async findActive(): Promise<CaptchaSetting | null> {
    const doc = await this.captchaModel.findOne({ enabled: true }).sort({ sort: 1 }).lean()
    return doc ? this.toSettingFromLean(doc) : null
  }
  //#endregion

  //#region 内部映射
  private toSetting(doc: CaptchaSettingDocument): CaptchaSetting {
    return {
      id: String(doc._id),
      provider: doc.provider as CaptchaProvider,
      config: doc.config ?? {},
      enabled: doc.enabled,
      sort: doc.sort,
    }
  }

  private toSettingFromLean(d: LeanCaptcha): CaptchaSetting {
    return {
      id: String(d._id),
      provider: d.provider as CaptchaProvider,
      config: d.config ?? {},
      enabled: d.enabled,
      sort: d.sort,
    }
  }
  //#endregion
}

interface LeanCaptcha {
  _id: unknown
  provider: string
  config?: Record<string, string>
  enabled: boolean
  sort: number
}

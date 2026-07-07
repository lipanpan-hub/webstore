import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { PaymentMethod, PaymentMethodDetail, PaymentProvider } from '@webstore/shared'
import { PaymentMethodEntity, PaymentMethodDocument } from './payment.schema.js'

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentMethodEntity.name)
    private readonly paymentModel: Model<PaymentMethodDocument>,
  ) {}

  async create(data: {
    name: string
    provider: PaymentProvider
    config: Record<string, string>
    sort?: number
  }): Promise<PaymentMethodDetail> {
    const doc = await this.paymentModel.create({ ...data, sort: data.sort ?? 0, enabled: true })
    return this.toDetail(doc)
  }

  async update(
    id: string,
    changes: {
      name?: string
      sort?: number
      enabled?: boolean
      config?: Record<string, string>
    },
  ): Promise<PaymentMethodDetail> {
    const doc = await this.paymentModel.findByIdAndUpdate(id, changes, { returnDocument: 'after' })
    if (!doc) throw new NotFoundException(`支付方式不存在: ${id}`)
    return this.toDetail(doc)
  }

  async remove(id: string): Promise<void> {
    const doc = await this.paymentModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundException(`支付方式不存在: ${id}`)
  }

  async findAll(): Promise<PaymentMethodDetail[]> {
    // 供 CLI 管理：返回含服务商配置的完整详情
    const docs = await this.paymentModel.find().sort({ sort: 1 }).lean()
    return docs.map((d) => this.toDetailFromLean(d))
  }

  async findDetailById(id: string): Promise<PaymentMethodDetail> {
    // 供下单流程按 ID 获取含服务商配置的支付方式详情
    const doc = await this.paymentModel.findById(id).lean()
    if (!doc) throw new NotFoundException(`支付方式不存在: ${id}`)
    // 返回含服务商配置(config)的完整支付方式详情 PaymentMethodDetail
    return this.toDetailFromLean(doc)
  }

  async findEnabled(): Promise<PaymentMethod[]> {
    // 仅返回启用中的支付方式，供前端购买表单选择（不含敏感配置）
    const docs = await this.paymentModel.find({ enabled: true }).sort({ sort: 1 }).lean()
    return docs.map((d) => this.toView(d))
  }

  //#region 内部映射
  private toView(d: LeanPayment): PaymentMethod {
    return {
      id: String(d._id),
      name: d.name,
      provider: d.provider as PaymentProvider,
      enabled: d.enabled,
      sort: d.sort,
    }
  }

  private toDetail(doc: PaymentMethodDocument): PaymentMethodDetail {
    return {
      id: String(doc._id),
      name: doc.name,
      provider: doc.provider as PaymentProvider,
      config: doc.config ?? {},
      enabled: doc.enabled,
      sort: doc.sort,
    }
  }

  private toDetailFromLean(d: LeanPayment): PaymentMethodDetail {
    return { ...this.toView(d), config: d.config ?? {} }
  }
  //#endregion
}

interface LeanPayment {
  _id: unknown
  name: string
  provider: string
  config?: Record<string, string>
  enabled: boolean
  sort: number
}

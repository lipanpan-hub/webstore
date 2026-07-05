import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { Card, CardStatus } from '@webstore/shared'
import { CardEntity, CardDocument } from './card.schema.js'

@Injectable()
export class CardService {
  constructor(
    @InjectModel(CardEntity.name) private readonly cardModel: Model<CardDocument>,
  ) {}

  async addCards(productId: string, secrets: string[]): Promise<number> {
    // 批量导入卡密，默认未售状态
    const docs = secrets.map((secret) => ({ productId, secret, status: 'unsold' as const }))
    const created = await this.cardModel.insertMany(docs)
    return created.length
  }

  async countStock(productId: string): Promise<number> {
    // 库存 = 该商品下未售卡密数量
    return this.cardModel.countDocuments({ productId, status: 'unsold' })
  }

  async countStockMap(productIds: string[]): Promise<Map<string, number>> {
    // 聚合批量统计，避免 N 次查询
    const rows = await this.cardModel.aggregate<{ _id: string; count: number }>([
      { $match: { productId: { $in: productIds }, status: 'unsold' } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
    ])
    const map = new Map<string, number>()
    for (const row of rows) map.set(row._id, row.count)
    return map
  }

  //#region 订单库存
  async lockCards(productId: string, quantity: number, orderId: string): Promise<string[]> {
    // 逐张原子锁定未售卡密，保证并发下不超卖；库存不足则回滚已锁定并报错
    const lockedIds: string[] = []
    for (let i = 0; i < quantity; i++) {
      const doc = await this.cardModel.findOneAndUpdate(
        { productId, status: 'unsold' },
        { status: 'locked', orderId },
        { returnDocument: 'after' },
      )
      if (!doc) {
        await this.releaseCards(lockedIds)
        throw new BadRequestException('库存不足，请稍后重试')
      }
      lockedIds.push(String(doc._id))
    }
    return lockedIds
  }

  async releaseCards(cardIds: string[]): Promise<void> {
    // 释放锁定卡密回到可售状态（订单超时或支付失败）
    if (cardIds.length === 0) return
    await this.cardModel.updateMany(
      { _id: { $in: cardIds } },
      { status: 'unsold', orderId: null },
    )
  }

  async markSold(cardIds: string[]): Promise<void> {
    // 支付成功后将锁定卡密标记为已售出（发货）
    if (cardIds.length === 0) return
    await this.cardModel.updateMany({ _id: { $in: cardIds } }, { status: 'sold' })
  }

  async getSecrets(cardIds: string[]): Promise<string[]> {
    const docs = await this.cardModel.find({ _id: { $in: cardIds } }).lean()
    return docs.map((d) => d.secret)
  }
  //#endregion

  async listByProduct(productId: string): Promise<Card[]> {
    const docs = await this.cardModel.find({ productId }).lean()
    return docs.map((d) => ({
      id: String(d._id),
      productId: d.productId,
      secret: d.secret,
      status: d.status,
    }))
  }

  async deleteCard(id: string): Promise<boolean> {
    // 按 ID 删除单条卡密，返回是否命中
    const { deletedCount } = await this.cardModel.deleteOne({ _id: id })
    return deletedCount > 0
  }

  async deleteByProduct(productId: string, status?: CardStatus): Promise<number> {
    // 批量删除某商品卡密，status 缺省时删除全部
    const filter = status ? { productId, status } : { productId }
    const { deletedCount } = await this.cardModel.deleteMany(filter)
    return deletedCount
  }
}

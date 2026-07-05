import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { Product, ProductStatus, ProductView } from '@webstore/shared'
import { ProductEntity, ProductDocument } from './product.schema.js'
import { CardService } from '../card/card.service.js'

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductEntity.name) private readonly productModel: Model<ProductDocument>,
    private readonly cardService: CardService,
  ) {}

  async create(input: {
    categoryId: string
    name: string
    price: number
    description?: string
    detail?: string
  }): Promise<Product> {
    const doc = await this.productModel.create({
      categoryId: input.categoryId,
      name: input.name,
      price: input.price,
      description: input.description ?? '',
      detail: input.detail ?? '',
      status: 'off',
    })
    return this.toView(doc)
  }

  async setStatus(id: string, status: ProductStatus): Promise<Product> {
    const doc = await this.productModel.findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
    if (!doc) throw new NotFoundException(`商品不存在: ${id}`)
    return this.toView(doc)
  }

  async setDetail(id: string, detail: string): Promise<Product> {
    const doc = await this.productModel.findByIdAndUpdate(id, { detail }, { returnDocument: 'after' })
    if (!doc) throw new NotFoundException(`商品不存在: ${id}`)
    return this.toView(doc)
  }

  async findByIdWithStock(id: string): Promise<ProductView> {
    // 单个商品详情：附带库存数量，供前端详情页使用
    const doc = await this.productModel.findById(id).lean()
    if (!doc) throw new NotFoundException(`商品不存在: ${id}`)
    const stock = await this.cardService.countStock(String(doc._id))
    return { ...this.toViewFromLean(doc), stock }
  }

  async findAll(): Promise<Product[]> {
    const docs = await this.productModel.find().lean()
    return docs.map((d) => this.toViewFromLean(d))
  }

  async findOnShelfWithStock(): Promise<ProductView[]> {
    // 仅返回上架商品，并附带库存数量
    const docs = await this.productModel.find({ status: 'on' }).lean()
    const ids = docs.map((d) => String(d._id))
    const stockMap = await this.cardService.countStockMap(ids)
    return docs.map((d) => ({
      ...this.toViewFromLean(d),
      stock: stockMap.get(String(d._id)) ?? 0,
    }))
  }

  //#region 内部映射
  private toView(doc: ProductDocument): Product {
    return {
      id: String(doc._id),
      categoryId: doc.categoryId,
      name: doc.name,
      description: doc.description,
      detail: doc.detail,
      price: doc.price,
      status: doc.status,
    }
  }

  private toViewFromLean(d: {
    _id: unknown
    categoryId: string
    name: string
    description: string
    detail: string
    price: number
    status: ProductStatus
  }): Product {
    return {
      id: String(d._id),
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      detail: d.detail,
      price: d.price,
      status: d.status,
    }
  }
  //#endregion
}

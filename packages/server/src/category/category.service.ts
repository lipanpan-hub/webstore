import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { Category } from '@webstore/shared'
import { CategoryEntity, CategoryDocument } from './category.schema.js'

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(CategoryEntity.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(name: string, sort = 0): Promise<Category> {
    const doc = await this.categoryModel.create({ name, sort })
    return this.toView(doc)
  }

  async findAll(): Promise<Category[]> {
    const docs = await this.categoryModel.find().sort({ sort: 1 }).lean()
    return docs.map((d) => ({ id: String(d._id), name: d.name, sort: d.sort }))
  }

  private toView(doc: CategoryDocument): Category {
    return { id: String(doc._id), name: doc.name, sort: doc.sort }
  }
}

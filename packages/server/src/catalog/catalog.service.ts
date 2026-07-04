import { Injectable } from '@nestjs/common'
import type { CategoryWithProducts } from '@webstore/shared'
import { CategoryService } from '../category/category.service.js'
import { ProductService } from '../product/product.service.js'

@Injectable()
export class CatalogService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
  ) {}

  async getCatalog(): Promise<CategoryWithProducts[]> {
    // 组合分类与上架商品（含库存），仅返回有上架商品的分类
    const [categories, products] = await Promise.all([
      this.categoryService.findAll(),
      this.productService.findOnShelfWithStock(),
    ])
    return categories
      .map((category) => ({
        ...category,
        products: products.filter((p) => p.categoryId === category.id),
      }))
      .filter((c) => c.products.length > 0)
  }
}

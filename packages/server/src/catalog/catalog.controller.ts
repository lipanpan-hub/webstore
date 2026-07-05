import { Controller, Get } from '@nestjs/common'
import type { ApiResponse, CategoryWithProducts } from '@webstore/shared'
import { CatalogService } from './catalog.service.js'

// 商品目录控制器：为前端商城首页提供浏览数据
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async getCatalog(): Promise<ApiResponse<CategoryWithProducts[]>> {
    // GET /catalog 游客首页目录：返回含上架商品的分类及其商品（带库存）
    const data = await this.catalogService.getCatalog()
    return { code: 200, message: 'ok', data }
  }
}

import { Controller, Get, Param } from '@nestjs/common'
import type { ApiResponse, ProductView } from '@webstore/shared'
import { ProductService } from './product.service.js'

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async listOnShelf(): Promise<ApiResponse<ProductView[]>> {
    const data = await this.productService.findOnShelfWithStock()
    return { code: 200, message: 'ok', data }
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<ApiResponse<ProductView>> {
    // GET /products/:id 商品详情：返回单个商品（含详情内容与库存）
    const data = await this.productService.findByIdWithStock(id)
    return { code: 200, message: 'ok', data }
  }
}

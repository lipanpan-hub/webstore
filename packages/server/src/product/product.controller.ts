import { Controller, Get } from '@nestjs/common'
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
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import type {
  ApiResponse,
  AdminCreateProductInput,
  Product,
  ProductStatus,
} from '@webstore/shared'
import { ProductService } from './product.service.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { PermissionsGuard } from '../auth/permissions.guard.js'
import { RequirePermissions } from '../auth/require-permissions.decorator.js'
import { PERMISSIONS } from '../auth/permissions.js'

// 商品管理接口：受 product 读/写权限保护
@Controller('admin/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductAdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  async list(): Promise<ApiResponse<Product[]>> {
    const data = await this.productService.findAll()
    return { code: 200, message: 'ok', data }
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  async create(@Body() body: AdminCreateProductInput): Promise<ApiResponse<Product>> {
    const data = await this.productService.create(body)
    return { code: 200, message: 'ok', data }
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
  ): Promise<ApiResponse<Product>> {
    const data = await this.productService.setStatus(id, status)
    return { code: 200, message: 'ok', data }
  }

  @Patch(':id/detail')
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  async setDetail(
    @Param('id') id: string,
    @Body('detail') detail: string,
  ): Promise<ApiResponse<Product>> {
    const data = await this.productService.setDetail(id, detail ?? '')
    return { code: 200, message: 'ok', data }
  }
}

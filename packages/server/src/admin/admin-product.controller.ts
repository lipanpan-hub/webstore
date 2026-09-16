import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import type { ApiResponse, Product, ProductStatus } from '@webstore/shared'
import { ApiKeyGuard } from '../apikey/api-key.guard.js'
import { RequireScopes } from '../apikey/require-scopes.decorator.js'
import { ProductService } from '../product/product.service.js'

interface CreateProductBody {
  categoryId?: string
  name?: string
  price?: number
  description?: string
}

interface ShelfBody {
  status?: ProductStatus
}

interface DetailBody {
  detail?: string
}

@Controller('admin/products')
@UseGuards(ApiKeyGuard)
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequireScopes('product:read')
  async list(): Promise<ApiResponse<Product[]>> {
    const data = await this.productService.findAll()
    return { code: 200, message: 'ok', data }
  }

  @Post()
  @RequireScopes('product:create')
  async create(@Body() body: CreateProductBody): Promise<ApiResponse<Product>> {
    if (!body.categoryId?.trim()) throw new BadRequestException('缺少所属分类 ID')
    if (!body.name?.trim()) throw new BadRequestException('商品名称不能为空')
    if (typeof body.price !== 'number' || body.price < 0) {
      throw new BadRequestException('商品价格必须为非负数')
    }
    const data = await this.productService.create({
      categoryId: body.categoryId.trim(),
      name: body.name.trim(),
      price: body.price,
      description: body.description,
    })
    return { code: 200, message: 'ok', data }
  }

  @Patch(':id/shelf')
  @RequireScopes('product:shelf')
  async shelf(
    @Param('id') id: string,
    @Body() body: ShelfBody,
  ): Promise<ApiResponse<Product>> {
    if (body.status !== 'on' && body.status !== 'off') {
      throw new BadRequestException('status 只能为 on 或 off')
    }
    const data = await this.productService.setStatus(id, body.status)
    return { code: 200, message: 'ok', data }
  }

  @Patch(':id/detail')
  @RequireScopes('product:detail')
  async detail(
    @Param('id') id: string,
    @Body() body: DetailBody,
  ): Promise<ApiResponse<Product>> {
    const data = await this.productService.setDetail(id, body.detail ?? '')
    return { code: 200, message: 'ok', data }
  }
}

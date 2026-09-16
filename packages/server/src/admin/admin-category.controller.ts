import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import type { ApiResponse, Category } from '@webstore/shared'
import { ApiKeyGuard } from '../apikey/api-key.guard.js'
import { RequireScopes } from '../apikey/require-scopes.decorator.js'
import { CategoryService } from '../category/category.service.js'

interface CreateCategoryBody {
  name?: string
  sort?: number
}

@Controller('admin/categories')
@UseGuards(ApiKeyGuard)
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @RequireScopes('category:read')
  async list(): Promise<ApiResponse<Category[]>> {
    const data = await this.categoryService.findAll()
    return { code: 200, message: 'ok', data }
  }

  @Post()
  @RequireScopes('category:create')
  async create(@Body() body: CreateCategoryBody): Promise<ApiResponse<Category>> {
    if (!body.name?.trim()) throw new BadRequestException('分类名称不能为空')
    const data = await this.categoryService.create(body.name.trim(), body.sort)
    return { code: 200, message: 'ok', data }
  }
}

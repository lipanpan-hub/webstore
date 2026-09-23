import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import type { ApiResponse, AdminCreateCategoryInput, Category } from '@webstore/shared'
import { CategoryService } from './category.service.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { PermissionsGuard } from '../auth/permissions.guard.js'
import { RequirePermissions } from '../auth/require-permissions.decorator.js'
import { PERMISSIONS } from '../auth/permissions.js'

// 分类管理接口：受 category 读/写权限保护
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoryAdminController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CATEGORY_READ)
  async list(): Promise<ApiResponse<Category[]>> {
    const data = await this.categoryService.findAll()
    return { code: 200, message: 'ok', data }
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CATEGORY_WRITE)
  async create(@Body() body: AdminCreateCategoryInput): Promise<ApiResponse<Category>> {
    const data = await this.categoryService.create(body.name, body.sort ?? 0)
    return { code: 200, message: 'ok', data }
  }
}

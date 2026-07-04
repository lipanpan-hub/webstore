import { Controller, Get } from '@nestjs/common'
import type { ApiResponse, CategoryWithProducts } from '@webstore/shared'
import { CatalogService } from './catalog.service.js'

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async getCatalog(): Promise<ApiResponse<CategoryWithProducts[]>> {
    const data = await this.catalogService.getCatalog()
    return { code: 200, message: 'ok', data }
  }
}

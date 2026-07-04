import { Module } from '@nestjs/common'
import { CategoryModule } from '../category/category.module.js'
import { ProductModule } from '../product/product.module.js'
import { CatalogService } from './catalog.service.js'
import { CatalogController } from './catalog.controller.js'

@Module({
  imports: [CategoryModule, ProductModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CategoryEntity, CategorySchema } from './category.schema.js'
import { CategoryService } from './category.service.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: CategoryEntity.name, schema: CategorySchema }])],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}

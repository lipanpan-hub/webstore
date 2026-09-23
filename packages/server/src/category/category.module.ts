import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CategoryEntity, CategorySchema } from './category.schema.js'
import { CategoryService } from './category.service.js'
import { CategoryAdminController } from './category.admin.controller.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CategoryEntity.name, schema: CategorySchema }]),
    AuthModule,
  ],
  controllers: [CategoryAdminController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}

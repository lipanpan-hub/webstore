import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProductEntity, ProductSchema } from './product.schema.js'
import { ProductService } from './product.service.js'
import { ProductController } from './product.controller.js'
import { CardModule } from '../card/card.module.js'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProductEntity.name, schema: ProductSchema }]),
    CardModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

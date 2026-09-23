import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RoleEntity, RoleSchema } from './role.schema.js'
import { RoleService } from './role.service.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: RoleEntity.name, schema: RoleSchema }])],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}

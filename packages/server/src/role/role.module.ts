import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RoleEntity, RoleSchema } from './role.schema.js'
import { RoleService } from './role.service.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: RoleEntity.name, schema: RoleSchema }])],
  // 导出 Service 供 ApiKeyModule 解析权限与 CLI 管理复用
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}

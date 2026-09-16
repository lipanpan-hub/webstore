import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ApiKeyEntity, ApiKeySchema } from './api-key.schema.js'
import { ApiKeyService } from './api-key.service.js'
import { ApiKeyGuard } from './api-key.guard.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: ApiKeyEntity.name, schema: ApiKeySchema }])],
  // 导出 Service 供 CLI 与 Guard 复用，导出 Guard 供 admin 各 controller @UseGuards 解析
  providers: [ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}

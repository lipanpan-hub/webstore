import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ApiKeyEntity, ApiKeySchema } from './api-key.schema.js'
import { ApiKeyService } from './api-key.service.js'
import { ApiKeyGuard } from './api-key.guard.js'
import { SecretCipher } from './api-key.cipher.js'
import { RoleModule } from '../role/role.module.js'

@Module({
  // 引入 RoleModule 以在 verify 时把角色解析为有效 scope
  imports: [
    MongooseModule.forFeature([{ name: ApiKeyEntity.name, schema: ApiKeySchema }]),
    RoleModule,
  ],
  // SecretCipher 封装 secret 加解密；导出 Service 供 CLI 与 Guard 复用，
  // 导出 Guard 供 admin 各 controller @UseGuards 解析
  providers: [ApiKeyService, ApiKeyGuard, SecretCipher],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}

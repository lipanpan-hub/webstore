import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import type { JwtModuleOptions } from '@nestjs/jwt'
import { UserModule } from '../user/user.module.js'

// expiresIn 被收窄为 ms 库的模板字面量类型，此处从其自身类型派生用于断言
type ExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'
import { PermissionsGuard } from './permissions.guard.js'

@Module({
  imports: [
    UserModule,
    // 异步注册以从 .env 读取签名密钥与有效期
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-insecure-secret-change-me'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as ExpiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
  // 导出守卫与 JwtModule，供各领域模块保护其管理接口
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, JwtModule],
})
export class AuthModule {}

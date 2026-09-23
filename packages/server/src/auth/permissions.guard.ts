import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Permission } from '@webstore/shared'
import type { AuthRequest } from './auth.types.js'
import { REQUIRE_PERMISSIONS_KEY } from './require-permissions.decorator.js'
import { hasPermission } from './permissions.js'

// 授权守卫：读取接口 @RequirePermissions 声明，校验当前用户是否具备全部所需权限
// 需搭配 JwtAuthGuard 使用（依赖其挂载的 req.user）
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 合并方法级与类级声明，取所需权限点
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )
    // 未声明所需权限的接口直接放行
    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest<AuthRequest>()
    const owned = req.user?.permissions ?? []
    const missing = required.filter((perm) => !hasPermission(owned, perm))
    if (missing.length > 0) {
      throw new ForbiddenException(`权限不足，需要: ${missing.join(', ')}`)
    }
    return true
  }
}

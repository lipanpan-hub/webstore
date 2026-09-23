import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthRequest, JwtPayload } from './auth.types.js'

// 参数装饰器：从请求中取出已认证用户（由 JwtAuthGuard 挂载）
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>()
    return req.user
  },
)

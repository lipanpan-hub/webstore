import type { Permission } from '@webstore/shared'

// JWT 载荷：登录时签发，权限点随 token 下发，鉴权时无需再查库
export interface JwtPayload {
  sub: string // 用户 ID
  username: string
  roles: string[]
  permissions: Permission[]
}

// 精简请求类型：避免引入 @types/express，仅声明鉴权所需字段
// user 由 JwtAuthGuard 解析 token 后挂载
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>
  user?: JwtPayload
}

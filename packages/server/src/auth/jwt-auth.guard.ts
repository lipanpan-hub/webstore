import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { AuthRequest, JwtPayload } from './auth.types.js'

// 认证守卫：校验 Authorization: Bearer <token>，通过后把载荷挂到 req.user
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>()
    const token = this.extractToken(req)
    if (!token) throw new UnauthorizedException('未提供访问令牌')

    try {
      req.user = this.jwtService.verify<JwtPayload>(token)
      return true
    } catch {
      throw new UnauthorizedException('访问令牌无效或已过期')
    }
  }

  private extractToken(req: AuthRequest): string | undefined {
    const raw = req.headers['authorization']
    const header = Array.isArray(raw) ? raw[0] : raw
    if (!header) return undefined
    // 形如 `Bearer <token>`
    const [scheme, token] = header.split(' ')
    return scheme === 'Bearer' && token ? token : undefined
  }
}

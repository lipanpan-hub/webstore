import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { ApiKeyInfo } from '@webstore/shared'
import { ApiKeyService } from './api-key.service.js'
import { REQUIRED_SCOPES_KEY } from './require-scopes.decorator.js'
import { isScopeGranted } from './api-key.scope.js'

// 携带鉴权结果的请求：仅声明鉴权所需的最小结构，避免耦合具体 HTTP 框架类型
export interface AuthedRequest {
  headers: Record<string, string | string[] | undefined>
  apiKey?: ApiKeyInfo
}

// 元数据驱动的声明式授权守卫：认证 API Key 并校验其是否覆盖路由所需的细粒度权限
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest<AuthedRequest>()
    const rawKey = this.extractKey(request)
    if (!rawKey) throw new UnauthorizedException('缺少 API Key')

    const apiKey = await this.apiKeyService.verify(rawKey)
    if (!apiKey) throw new UnauthorizedException('API Key 无效或已停用')

    // 逐项校验路由所需权限，任一未覆盖即拒绝
    for (const scope of required ?? []) {
      if (!isScopeGranted(apiKey.scopes, scope)) {
        throw new ForbiddenException(`缺少权限: ${scope}`)
      }
    }

    request.apiKey = apiKey
    return true
  }

  // 从 Authorization: Bearer <key> 或 X-API-Key 头提取明文 key
  private extractKey(request: AuthedRequest): string | undefined {
    const auth = request.headers.authorization
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.slice('Bearer '.length).trim()
    }
    const headerKey = request.headers['x-api-key']
    if (typeof headerKey === 'string') return headerKey.trim()
    return undefined
  }
}

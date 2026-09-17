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
import {
  HEADER_KEY_ID,
  HEADER_NONCE,
  HEADER_SIGNATURE,
  HEADER_TIMESTAMP,
  buildCanonicalString,
} from './api-key.signature.js'

// 携带鉴权结果的请求：仅声明鉴权所需的最小结构，避免耦合具体 HTTP 框架类型
export interface AuthedRequest {
  method: string
  // 含 query 的原始路径，参与签名以防路径/参数被篡改
  url: string
  headers: Record<string, string | string[] | undefined>
  // main.ts 开启 rawBody 后由框架填充，验签需按原始字节还原 body 哈希
  rawBody?: Buffer
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

    // 认证环节：从签名头组装 canonical 串交由 service 验签，secret 不经网络传输
    const keyId = this.header(request, HEADER_KEY_ID)
    const timestamp = this.header(request, HEADER_TIMESTAMP)
    const nonce = this.header(request, HEADER_NONCE)
    const signature = this.header(request, HEADER_SIGNATURE)
    if (!keyId || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException('缺少签名认证头')
    }

    const canonicalString = buildCanonicalString({
      method: request.method,
      path: request.url,
      timestamp,
      nonce,
      rawBody: request.rawBody,
    })
    const apiKey = await this.apiKeyService.verifySignature({
      keyId,
      timestamp,
      nonce,
      signature,
      canonicalString,
    })

    // 授权环节：逐项校验路由所需权限，任一未覆盖即拒绝（逻辑保持不变）
    for (const scope of required ?? []) {
      if (!isScopeGranted(apiKey.scopes, scope)) {
        throw new ForbiddenException(`缺少权限: ${scope}`)
      }
    }

    request.apiKey = apiKey
    return true
  }

  // 读取单个请求头的字符串值，缺失或非字符串一律返回 undefined
  private header(request: AuthedRequest, name: string): string | undefined {
    const value = request.headers[name]
    return typeof value === 'string' ? value.trim() : undefined
  }
}

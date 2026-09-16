import { SetMetadata } from '@nestjs/common'
import type { ApiKeyScope } from '@webstore/shared'

// 元数据键：ApiKeyGuard 据此读取路由声明的所需权限
export const REQUIRED_SCOPES_KEY = 'required_scopes'

// 声明式授权：在管理接口方法上标注其所需的细粒度权限，例如 @RequireScopes('product:shelf')
export const RequireScopes = (...scopes: ApiKeyScope[]) =>
  SetMetadata(REQUIRED_SCOPES_KEY, scopes)

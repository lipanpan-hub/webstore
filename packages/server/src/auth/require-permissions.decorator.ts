import { SetMetadata } from '@nestjs/common'
import type { Permission } from '@webstore/shared'

// 元数据键：PermissionsGuard 据此读取接口所需权限点
export const REQUIRE_PERMISSIONS_KEY = 'require_permissions'

// 声明访问某接口所需的权限点（需全部满足）
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions)

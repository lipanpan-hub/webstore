import type { Permission } from '@webstore/shared'

// 权限点注册表：集中定义系统所有权限点与内置角色，复用项目既有的“注册表模式”
// 新增受保护资源时只需在此登记权限点，Guard 与内置角色 seed 会据此生效

//#region 权限点定义
// 权限点采用 `资源:动作` 命名，动作拆分 read（读）/ write（写）两级
export const PERMISSIONS = {
  CATEGORY_READ: 'category:read',
  CATEGORY_WRITE: 'category:write',
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  CARD_READ: 'card:read',
  CARD_WRITE: 'card:write',
} as const

// 通配权限：拥有者放行一切权限校验，仅授予超级管理员
export const WILDCARD_PERMISSION: Permission = '*'

// 全部具体权限点（不含通配），供内置 admin 角色与校验参考
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)
//#endregion

//#region 内置角色定义
export interface BuiltinRoleDef {
  name: string
  description: string
  permissions: Permission[]
}

// 内置角色：系统启动时确保存在（幂等）
// - admin：超级管理员，持通配权限
// - user：注册默认角色，仅授予三类只读权限（基础权限，不含任何写操作）
export const BUILTIN_ROLES: BuiltinRoleDef[] = [
  {
    name: 'admin',
    description: '超级管理员（全部权限）',
    permissions: [WILDCARD_PERMISSION],
  },
  {
    name: 'user',
    description: '基础用户（默认注册角色，仅只读）',
    permissions: [PERMISSIONS.CATEGORY_READ, PERMISSIONS.PRODUCT_READ, PERMISSIONS.CARD_READ],
  },
]

// 注册默认角色名：新用户注册时赋予
export const DEFAULT_ROLE_NAME = 'user'
//#endregion

//#region 权限判定
// 判断持有的权限集合是否满足所需权限：命中通配或包含该权限点即为满足
export function hasPermission(owned: Permission[], required: Permission): boolean {
  return owned.includes(WILDCARD_PERMISSION) || owned.includes(required)
}
//#endregion

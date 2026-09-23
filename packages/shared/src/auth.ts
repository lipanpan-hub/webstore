// 权限点标识：`资源:动作` 形式（如 product:read / product:write）；`*` 表示通配全部权限
export type Permission = string

// 用户状态：active 正常 / disabled 已停用（停用后不可登录）
export type UserStatus = 'active' | 'disabled'

// 角色视图：角色名唯一，permissions 为其拥有的权限点集合
export interface RoleView {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

// 登录用户视图（不含密码）：permissions 为其所有角色权限点的并集，供前端做界面级权限控制
export interface AuthUserView {
  id: string
  username: string
  roles: string[]
  permissions: Permission[]
  status: UserStatus
}

// 注册入参：注册后默认仅赋予基础角色（低权限）
export interface RegisterInput {
  username: string
  password: string
}

// 登录入参
export interface LoginInput {
  username: string
  password: string
}

// 登录/注册结果：token 为 JWT，后续请求置于 Authorization: Bearer <token>
export interface AuthResult {
  token: string
  user: AuthUserView
}

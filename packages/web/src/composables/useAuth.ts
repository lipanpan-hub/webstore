import { computed, ref } from 'vue'
import type {
  ApiResponse,
  AuthResult,
  AuthUserView,
  LoginInput,
  Permission,
  RegisterInput,
} from '@webstore/shared'
import { API_BASE } from '@/config'

// 认证状态管理：沿用项目 useTheme 的“模块级单例”写法，整个应用共享同一份登录态
// 令牌与用户信息持久化到 localStorage，刷新页面后仍保持登录

//#region 持久化键与初始状态
const TOKEN_KEY = 'webstore-token'
const USER_KEY = 'webstore-user'

// 通配权限：拥有者放行一切界面级权限校验（与后端 permissions.ts 保持一致）
const WILDCARD_PERMISSION: Permission = '*'

function loadUser(): AuthUserView | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUserView
  } catch {
    return null
  }
}

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const user = ref<AuthUserView | null>(loadUser())
//#endregion

//#region 会话读写
function setSession(result: AuthResult) {
  token.value = result.token
  user.value = result.user
  localStorage.setItem(TOKEN_KEY, result.token)
  localStorage.setItem(USER_KEY, JSON.stringify(result.user))
}

function clearSession() {
  token.value = null
  user.value = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
//#endregion

//#region 派生状态与权限判断
const isLoggedIn = computed(() => Boolean(token.value))

// 界面级权限判断：命中通配或包含该权限点即为满足
function hasPermission(required: Permission): boolean {
  const owned = user.value?.permissions ?? []
  return owned.includes(WILDCARD_PERMISSION) || owned.includes(required)
}
//#endregion

//#region 认证请求
// 注册：成功后写入会话（后端注册即自动登录）
async function register(input: RegisterInput): Promise<void> {
  const result = await request<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setSession(result)
}

// 登录：成功后写入会话
async function login(input: LoginInput): Promise<void> {
  const result = await request<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setSession(result)
}

function logout() {
  clearSession()
}

// 带令牌的通用请求：自动附加 Authorization 头，401 时清除会话，非 200 抛出后端提示
async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, true)
}

// 内部统一请求实现：withAuth 控制是否携带令牌
async function request<T>(path: string, options: RequestInit, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }
  if (withAuth && token.value) headers['Authorization'] = `Bearer ${token.value}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  // 令牌失效：清除本地会话，交由路由守卫跳回登录
  if (res.status === 401) {
    clearSession()
    throw new Error('登录已过期，请重新登录')
  }

  const body: ApiResponse<T> = await res.json()
  if (body.code !== 200) throw new Error(body.message || '请求失败')
  return body.data
}
//#endregion

export function useAuth() {
  return { token, user, isLoggedIn, hasPermission, register, login, logout, authFetch }
}

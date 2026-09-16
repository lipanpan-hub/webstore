import type { ApiKeyScope } from '@webstore/shared'

// 注册表模式：集中定义全部细粒度权限，新增资源或动作只需扩展此注册表，
// CLI 勾选与 Guard 校验均以此为唯一权威来源，杜绝散落的魔法字符串。

// 单个动作定义
export interface ScopeActionDef {
  // 完整 scope 字符串，如 product:shelf
  scope: ApiKeyScope
  // 中文说明，供 CLI 展示
  label: string
}

// 单个资源定义（含其下所有动作）
export interface ScopeResourceDef {
  resource: string
  label: string
  actions: ScopeActionDef[]
}

export const ADMIN_SCOPES: ScopeResourceDef[] = [
  {
    resource: 'category',
    label: '分类',
    actions: [
      { scope: 'category:read', label: '查看分类列表' },
      { scope: 'category:create', label: '新建分类' },
    ],
  },
  {
    resource: 'product',
    label: '商品',
    actions: [
      { scope: 'product:read', label: '商品列表与详情' },
      { scope: 'product:create', label: '新增商品' },
      { scope: 'product:shelf', label: '上架 / 下架' },
      { scope: 'product:detail', label: '编辑商品详情内容' },
    ],
  },
  {
    resource: 'card',
    label: '卡密',
    actions: [
      { scope: 'card:read', label: '查看卡密与库存' },
      { scope: 'card:import', label: '导入卡密' },
      { scope: 'card:delete', label: '删除卡密' },
    ],
  },
  {
    resource: 'payment',
    label: '支付方式',
    actions: [
      { scope: 'payment:read', label: '查看支付方式（含配置）' },
      { scope: 'payment:create', label: '新增支付方式' },
      { scope: 'payment:update', label: '修改 / 启停支付方式' },
      { scope: 'payment:delete', label: '删除支付方式' },
    ],
  },
  {
    resource: 'captcha',
    label: '验证码',
    actions: [
      { scope: 'captcha:read', label: '查看验证码配置' },
      { scope: 'captcha:create', label: '新增验证码配置' },
      { scope: 'captcha:update', label: '修改 / 启停验证码配置' },
      { scope: 'captcha:delete', label: '删除验证码配置' },
    ],
  },
  {
    resource: 'order',
    label: '订单',
    actions: [{ scope: 'order:read', label: '查询订单列表与详情' }],
  },
]

// 超级通配：授予全部权限
export const WILDCARD_ALL: ApiKeyScope = '*'

// 全部具体 scope 的扁平集合，用于校验合法性
const CONCRETE_SCOPES = new Set<string>(
  ADMIN_SCOPES.flatMap((res) => res.actions.map((a) => a.scope)),
)

// 全部资源级通配 scope 的集合，如 product:*
const RESOURCE_WILDCARDS = new Set<string>(ADMIN_SCOPES.map((res) => `${res.resource}:*`))

// 判断某个 scope 字符串是否为注册表认可的合法权限（含通配形式）
export function isValidScope(scope: string): boolean {
  return scope === WILDCARD_ALL || RESOURCE_WILDCARDS.has(scope) || CONCRETE_SCOPES.has(scope)
}

// 判断持有的 scope 集合是否覆盖某项所需权限：优先精确命中，再看资源级与全局通配
export function isScopeGranted(granted: string[], required: ApiKeyScope): boolean {
  if (granted.includes(WILDCARD_ALL)) return true
  if (granted.includes(required)) return true
  const resource = required.split(':')[0]
  return granted.includes(`${resource}:*`)
}

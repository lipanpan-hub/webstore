import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// 密码哈希工具：使用 Node 内置 scrypt（加盐 + 慢哈希），零第三方依赖
// 存储格式为 `salt:hash`（均为 hex），校验时按同盐重算并做定长时安全比较

const KEY_LENGTH = 64

// 生成 `salt:hash` 格式的密码哈希
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(plain, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${derived}`
}

// 校验明文密码与存储哈希是否匹配
export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false

  const derived = scryptSync(plain, salt, KEY_LENGTH)
  const expectedBuf = Buffer.from(expected, 'hex')
  // 长度不一致直接判否，避免 timingSafeEqual 抛错
  if (derived.length !== expectedBuf.length) return false
  return timingSafeEqual(derived, expectedBuf)
}

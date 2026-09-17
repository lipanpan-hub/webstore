import { createHash } from 'node:crypto'

// HMAC 签名协议的单一权威定义：服务端 Guard 与任意客户端都必须按此约定组装
// 待签名字符串，任何一处不一致都会导致验签失败。集中在此避免两端各写一份而漂移。

//#region 请求头约定
// 公开标识：声明本次请求使用哪把 API Key
export const HEADER_KEY_ID = 'x-api-key-id'
// 请求时间戳（Unix 秒）：用于时间窗口校验，抵御长期重放
export const HEADER_TIMESTAMP = 'x-api-timestamp'
// 一次性随机串：用于同一时间窗口内的重放去重
export const HEADER_NONCE = 'x-api-nonce'
// 请求签名：HMAC-SHA256(secret, canonicalString) 的 hex 值
export const HEADER_SIGNATURE = 'x-api-signature'
//#endregion

//#region 时间窗口
// 允许的客户端与服务端时钟偏移窗口（秒），超出即判定为过期请求
export const TIMESTAMP_WINDOW_SECONDS = 300
//#endregion

//#region 待签名字符串
// 组装 canonical string：以换行分隔各要素，顺序固定，无歧义。
// body 参与签名以防篡改，GET 等无体请求按空串取 sha256。
export function buildCanonicalString(input: {
  method: string
  path: string
  timestamp: string
  nonce: string
  rawBody: Buffer | string | undefined
}): string {
  const bodyHash = createHash('sha256')
    .update(input.rawBody ?? '')
    .digest('hex')
  return [
    input.method.toUpperCase(),
    input.path,
    input.timestamp,
    input.nonce,
    bodyHash,
  ].join('\n')
}
//#endregion

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

// AES-256-GCM 对称加解密工具：单一职责地封装 API Key secret 的加密存储，
// 让 secret 既能被服务端还原以做 HMAC 验签，又不以明文落库。
// 存储格式为 hex 编码的 "iv:authTag:ciphertext"，三段以冒号分隔。

// GCM 推荐 12 字节 IV
const IV_LENGTH = 12
// 密文分段数（iv / authTag / ciphertext）
const SEGMENTS = 3

@Injectable()
export class SecretCipher {
  // 由 .env 主密钥经 sha256 派生的 32 字节密钥，满足 AES-256 定长要求
  private readonly key: Buffer

  constructor(config: ConfigService) {
    const master = config.get<string>('APIKEY_SIGNING_SECRET', '').trim()
    if (!master) {
      throw new Error('缺少 APIKEY_SIGNING_SECRET，无法加解密 API Key 签名密钥')
    }
    // sha256 派生：允许主密钥为任意长度字符串，输出恒为 32 字节
    this.key = createHash('sha256').update(master).digest()
  }

  // 加密明文 secret，返回可直接入库的 "iv:authTag:ciphertext" 字符串
  encrypt(plain: string): string {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':')
  }

  // 解密入库密文还原明文 secret；格式非法或校验失败均抛错
  decrypt(stored: string): string {
    const parts = stored.split(':')
    if (parts.length !== SEGMENTS) throw new Error('API Key 密文格式非法')
    const [ivHex, tagHex, dataHex] = parts
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ])
    return plain.toString('utf8')
  }
}

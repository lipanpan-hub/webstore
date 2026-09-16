import type {
  AdminOrderView,
  CaptchaSetting,
  OrderStatus,
  PaymentMethodDetail,
} from './api/index.js'
import {getCaptchaProviderDef, getPaymentProviderDef, maskSecret} from './providers.js'

// 展示工具: 集中各资源的控制台打印格式, 与服务端本地 CLI 的输出风格保持一致。

// 订单状态中文标签
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  expired: '已失效',
}

// 打印支付方式详情(敏感配置打码)
export function printPaymentDetail(p: PaymentMethodDetail): void {
  const def = getPaymentProviderDef(p.provider)
  console.log(`${p.id}  [sort=${p.sort}]  [${p.enabled ? '启用' : '停用'}]  ${p.name}  <${def.label}>`)
  for (const field of def.fields) {
    const raw = p.config[field.key] ?? ''
    let shown: string
    if (field.secret) shown = maskSecret(raw)
    else if (field.options) shown = field.options.find((o) => o.value === raw)?.title ?? (raw || '(未配置)')
    else shown = raw || '(未配置)'
    console.log(`    ${field.label}: ${shown}`)
  }
}

// 打印验证码配置详情(敏感配置打码)
export function printCaptchaDetail(c: CaptchaSetting): void {
  const def = getCaptchaProviderDef(c.provider)
  console.log(`${c.id}  [sort=${c.sort}]  [${c.enabled ? '启用' : '停用'}]  <${def.label}>`)
  for (const field of def.fields) {
    const raw = c.config[field.key] ?? ''
    const shown = field.secret ? maskSecret(raw) : raw || '(未配置)'
    console.log(`    ${field.label}: ${shown}`)
  }
}

// 打印单条订单概要
export function printOrder(o: AdminOrderView): void {
  const created = new Date(o.createdAt).toLocaleString()
  const paid = o.paidAt ? new Date(o.paidAt).toLocaleString() : '-'
  console.log(`${o.orderId}  [${ORDER_STATUS_LABELS[o.status]}]  ${o.productName} x${o.quantity}  ￥${o.totalAmount}`)
  console.log(`    邮箱: ${o.email}    支付方式: ${o.provider}`)
  console.log(`    创建: ${created}    支付: ${paid}`)
}

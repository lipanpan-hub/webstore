import type {
  AdminApiClient,
  CaptchaSetting,
  Card,
  Category,
  PaymentMethodDetail,
  Product,
} from './api/index.js'
import {pickFuzzy} from './interactive.js'
import {getCaptchaProviderDef, getPaymentProviderDef} from './providers.js'

// 资源选择器: 交互式挑选某条资源(先拉取列表再模糊搜索), 供多个命令复用。

// 选择一个商品分类
export async function pickCategory(client: AdminApiClient): Promise<Category> {
  const categories = await client.listCategories()
  if (categories.length === 0) throw new Error('暂无分类，请先执行 category add')
  return pickFuzzy('选择分类', categories, (c) => `${c.name}  [sort=${c.sort}]  (${c.id})`)
}

// 选择一个商品
export async function pickProduct(client: AdminApiClient): Promise<Product> {
  const products = await client.listProducts()
  if (products.length === 0) throw new Error('暂无商品，请先执行 product add')
  return pickFuzzy(
    '选择商品',
    products,
    (p) => `${p.name}  ￥${p.price}  [${p.status}]  (${p.id})`,
  )
}

// 先选商品, 再选该商品下的一条卡密
export async function pickCard(client: AdminApiClient): Promise<Card> {
  const product = await pickProduct(client)
  const cards = await client.listCards(product.id)
  if (cards.length === 0) throw new Error('该商品暂无卡密')
  return pickFuzzy('选择卡密', cards, (c) => `${c.secret}  [${c.status}]  (${c.id})`)
}

// 选择一个支付方式
export async function pickPayment(client: AdminApiClient): Promise<PaymentMethodDetail> {
  const list = await client.listPayments()
  if (list.length === 0) throw new Error('暂无支付方式，请先执行 payment add')
  return pickFuzzy(
    '选择支付方式',
    list,
    (p) =>
      `${p.name}  [${getPaymentProviderDef(p.provider).label}]  [${p.enabled ? '启用' : '停用'}]  (${p.id})`,
  )
}

// 选择一个验证码配置
export async function pickCaptcha(client: AdminApiClient): Promise<CaptchaSetting> {
  const list = await client.listCaptchas()
  if (list.length === 0) throw new Error('暂无验证码配置，请先执行 captcha add')
  return pickFuzzy(
    '选择验证码配置',
    list,
    (c) => `${getCaptchaProviderDef(c.provider).label}  [${c.enabled ? '启用' : '停用'}]  (${c.id})`,
  )
}

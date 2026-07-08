<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import type {
  ApiResponse,
  ProductView,
  PaymentMethod,
  CreateOrderResult,
  OrderStatusView,
} from '@webstore/shared'
import { API_BASE } from '@/config'

const route = useRoute()
const router = useRouter()

//#region 商品详情加载
const product = ref<ProductView | null>(null)
const loading = ref(true)
const error = ref('')

async function loadProduct() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/products/${route.params.id}`)
    const body: ApiResponse<ProductView> = await res.json()
    if (body.code !== 200) throw new Error(body.message)
    product.value = body.data
  } catch {
    error.value = '商品不存在或加载失败'
  } finally {
    loading.value = false
  }
}
//#endregion

//#region 支付方式加载
const payments = ref<PaymentMethod[]>([])

async function loadPayments() {
  try {
    const res = await fetch(`${API_BASE}/payments`)
    const body: ApiResponse<PaymentMethod[]> = await res.json()
    if (body.code === 200) {
      payments.value = body.data
      if (body.data.length > 0) form.paymentId = body.data[0].id
    }
  } catch {
    // 支付方式加载失败不阻塞页面，提交时校验兜底
  }
}
//#endregion

//#region 纯前端算术验证码
const captcha = reactive({ a: 0, b: 0, answer: 0 })

function makeCaptcha() {
  // 生成两位数加法题，答案存于内存供本地校验，无需后端
  captcha.a = Math.floor(Math.random() * 10) + 1
  captcha.b = Math.floor(Math.random() * 10) + 1
  captcha.answer = captcha.a + captcha.b
}
//#endregion

//#region 购买表单
const form = reactive({
  quantity: 1,
  email: '',
  orderPassword: '',
  paymentId: '',
  captchaInput: '',
})

const stock = computed(() => product.value?.stock ?? 0)
const totalPrice = computed(() =>
  product.value ? (product.value.price * form.quantity).toFixed(2) : '0.00',
)

function validate(): string {
  if (!Number.isInteger(form.quantity) || form.quantity < 1) return '购买数量至少为 1'
  if (form.quantity > stock.value) return `库存不足，仅剩 ${stock.value} 件`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '请输入正确的邮箱'
  if (!form.orderPassword.trim()) return '请设置订单密码'
  if (!form.paymentId) return '请选择支付方式'
  if (Number(form.captchaInput) !== captcha.answer) return '验证码错误'
  return ''
}

async function submit() {
  const msg = validate()
  if (msg) {
    alert(msg)
    if (msg === '验证码错误') makeCaptcha()
    return
  }
  submitting.value = true
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: route.params.id,
        quantity: form.quantity,
        email: form.email,
        orderPassword: form.orderPassword,
        paymentId: form.paymentId,
      }),
    })
    const body: ApiResponse<CreateOrderResult> = await res.json()
    if (body.code !== 200) throw new Error(body.message)
    await openPayment(body.data)
  } catch (e) {
    alert((e as Error).message || '下单失败')
  } finally {
    submitting.value = false
  }
}
//#endregion

//#region 支付弹窗与轮询
const submitting = ref(false)
const pay = reactive({
  open: false,
  qrDataUrl: '',
  status: 'pending' as OrderStatusView['status'],
  countdown: 0,
})
let pollTimer: number | undefined
let countdownTimer: number | undefined

async function openPayment(order: CreateOrderResult) {
  // 跳转类支付：直接跳转收银台，付款后经 return_url 跳回本页并携带 orderId
  if (order.payMode === 'redirect') {
    window.location.href = order.payPayload
    return
  }

  // 扫码类支付：生成二维码并开启轮询与倒计时
  pay.qrDataUrl = await QRCode.toDataURL(order.payPayload, { width: 220, margin: 1 })
  pay.status = 'pending'
  pay.open = true
  pay.countdown = Math.max(0, Math.ceil((order.expireAt - Date.now()) / 1000))

  countdownTimer = window.setInterval(() => {
    pay.countdown = Math.max(0, pay.countdown - 1)
    if (pay.countdown === 0) stopTimers()
  }, 1000)

  startPolling(order.orderId, order.accessToken)
}

function startPolling(orderId: string, token: string) {
  pollTimer = window.setInterval(() => pollStatus(orderId, token), 2000)
}

async function pollStatus(orderId: string, token: string) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status?token=${token}`)
    const body: ApiResponse<OrderStatusView> = await res.json()
    if (body.code !== 200) return
    pay.status = body.data.status
    if (body.data.status === 'paid') {
      // 支付成功：停止轮询并携带令牌跳转到卡密展示页
      stopTimers()
      router.push(`/result/${orderId}?token=${token}`)
    } else if (body.data.status === 'expired') {
      stopTimers()
    }
  } catch {
    // 单次轮询失败忽略，等待下次
  }
}

function stopTimers() {
  if (pollTimer) window.clearInterval(pollTimer)
  if (countdownTimer) window.clearInterval(countdownTimer)
  pollTimer = undefined
  countdownTimer = undefined
}

function closePayment() {
  stopTimers()
  pay.open = false
}
//#endregion

onMounted(() => {
  loadProduct()
  loadPayments()
  makeCaptcha()
})

onUnmounted(stopTimers)
</script>

<template>
  <div class="detail">
    <p v-if="loading" class="tip">加载中...</p>
    <p v-else-if="error" class="tip error">{{ error }}</p>

    <div v-else-if="product" class="detail-body">


      <section class="info">
        <h2 class="name">{{ product.name }}</h2>
        <p class="desc">{{ product.description || '暂无描述' }}</p>
        <div class="meta">
          <span class="price">￥{{ product.price }}</span>
          <span class="stock" :class="{ 'out-of-stock': stock === 0 }">
            {{ stock > 0 ? `库存 ${stock}` : '缺货' }}
          </span>
        </div>
        <div class="detail-text">
          <h3>商品详情</h3>
          <p>{{ product.detail || '暂无详情' }}</p>
        </div>
      </section>

      <section class="buy">
        <h3>购买</h3>
        <label class="field">
          <span>购买数量*</span>
          <input v-model.number="form.quantity" type="number" min="1" :max="stock" />
        </label>
        <label class="field">
          <span>邮箱*</span>
          <input v-model="form.email" type="email" placeholder="用于接收卡密" />
        </label>
        <label class="field">
          <span>订单密码*</span>
          <input v-model="form.orderPassword" type="password" placeholder="用于后续查询订单" />
        </label>
        <label class="field">
          <span>支付方式*</span>
          <select v-model="form.paymentId">
            <option v-if="payments.length === 0" value="">暂无可用支付方式</option>
            <option v-for="p in payments" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>验证码*</span>
          <div class="captcha">
            <input v-model="form.captchaInput" placeholder="请计算结果" />
            <button type="button" class="captcha-q" @click="makeCaptcha">
              {{ captcha.a }} + {{ captcha.b }} = ?
            </button>
          </div>
        </label>
        <div class="total">应付：<b>￥{{ totalPrice }}</b></div>
        <button class="submit" :disabled="stock === 0 || submitting" @click="submit">
          {{ stock === 0 ? '缺货' : submitting ? '提交中...' : '立即购买' }}
        </button>
      </section>
    </div>

    <!-- 支付弹窗 -->
    <div v-if="pay.open" class="pay-mask" @click.self="closePayment">
      <div class="pay-box">
        <button class="pay-close" @click="closePayment">×</button>

        <template v-if="pay.status === 'expired'">
          <h3 class="pay-fail">订单已失效</h3>
          <p class="pay-tip">超时未支付，库存已释放，请重新下单</p>
          <button class="submit" @click="closePayment">关闭</button>
        </template>

        <template v-else>
          <h3>扫码支付</h3>
          <img :src="pay.qrDataUrl" alt="支付二维码" class="pay-qr" />
          <p class="pay-tip">请使用支付宝扫码支付，支付成功后自动跳转</p>
          <p class="pay-countdown">
            剩余支付时间：<b>{{ Math.floor(pay.countdown / 60) }}:{{
              String(pay.countdown % 60).padStart(2, '0')
            }}</b>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tip {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}

.tip.error {
  color: var(--danger);
}

.back {
  display: inline-block;
  color: var(--primary);
  cursor: pointer;
  margin-bottom: 16px;
}

.detail-body {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 32px;
  align-items: start;
}

.name {
  font-size: 22px;
  margin-bottom: 8px;
}

.desc {
  color: var(--text-faint);
  margin-bottom: 12px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.price {
  color: var(--danger);
  font-weight: 600;
  font-size: 20px;
}

.stock {
  font-size: 12px;
  color: var(--success);
  background: var(--success-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.stock.out-of-stock {
  color: var(--text-faint);
  background: var(--chip-bg);
}

.detail-text {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.detail-text h3 {
  font-size: 15px;
  margin-bottom: 8px;
}

.detail-text p {
  color: var(--text-muted);
  line-height: 1.7;
  white-space: pre-wrap;
}

.buy {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  background: var(--surface);
}

.buy h3 {
  margin-bottom: 16px;
}

.field {
  display: block;
  margin-bottom: 14px;
}

.field > span {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.field input,
.field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
}

.captcha {
  display: flex;
  gap: 8px;
}

.captcha input {
  flex: 1;
}

.captcha-q {
  white-space: nowrap;
  padding: 0 12px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  background: var(--chip-bg);
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
}

.total {
  margin: 8px 0 16px;
  font-size: 14px;
}

.total b {
  color: var(--danger);
  font-size: 18px;
}

.submit {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}

.submit:disabled {
  background: #bbb;
  cursor: not-allowed;
}

.pay-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.pay-box {
  position: relative;
  width: 320px;
  background: var(--surface);
  color: var(--text);
  border-radius: 10px;
  padding: 24px;
  text-align: center;
}

.pay-box h3 {
  margin-bottom: 16px;
}

.pay-close {
  position: absolute;
  top: 8px;
  right: 12px;
  border: none;
  background: none;
  font-size: 22px;
  color: var(--text-faint);
  cursor: pointer;
}

.pay-qr {
  width: 220px;
  height: 220px;
}

.pay-tip {
  color: var(--text-muted);
  font-size: 13px;
  margin: 10px 0;
}

.pay-countdown b {
  color: var(--danger);
}

.pay-fail {
  color: var(--danger);
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ApiResponse, ProductView, PaymentMethod } from '@webstore/shared'
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

function submit() {
  const msg = validate()
  if (msg) {
    alert(msg)
    if (msg === '验证码错误') makeCaptcha()
    return
  }
  // 方案 A：暂不落库，仅提示提交成功并回显表单信息
  const payName = payments.value.find((p) => p.id === form.paymentId)?.name ?? '-'
  alert(
    `提交成功（占位）\n商品：${product.value?.name}\n数量：${form.quantity}\n` +
      `邮箱：${form.email}\n支付方式：${payName}\n应付：￥${totalPrice.value}`,
  )
}
//#endregion

onMounted(() => {
  loadProduct()
  loadPayments()
  makeCaptcha()
})
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
        <button class="submit" :disabled="stock === 0" @click="submit">
          {{ stock === 0 ? '缺货' : '立即购买' }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tip {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.tip.error {
  color: #e05353;
}

.back {
  display: inline-block;
  color: #4a90d9;
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
  color: #999;
  margin-bottom: 12px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.price {
  color: #e05353;
  font-weight: 600;
  font-size: 20px;
}

.stock {
  font-size: 12px;
  color: #52a852;
  background: #eef7ee;
  padding: 2px 8px;
  border-radius: 10px;
}

.stock.out-of-stock {
  color: #999;
  background: #f2f2f2;
}

.detail-text {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.detail-text h3 {
  font-size: 15px;
  margin-bottom: 8px;
}

.detail-text p {
  color: #555;
  line-height: 1.7;
  white-space: pre-wrap;
}

.buy {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
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
  color: #666;
  margin-bottom: 4px;
}

.field input,
.field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
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
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f7f7f7;
  cursor: pointer;
  font-size: 14px;
}

.total {
  margin: 8px 0 16px;
  font-size: 14px;
}

.total b {
  color: #e05353;
  font-size: 18px;
}

.submit {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #4a90d9;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}

.submit:disabled {
  background: #bbb;
  cursor: not-allowed;
}
</style>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { ApiResponse, OrderRecordView, OrderStatus } from '@webstore/shared'
import { API_BASE } from '@/config'

//#region 查询表单
const form = reactive({ email: '', orderPassword: '' })
const loading = ref(false)
const error = ref('')
const searched = ref(false)
const orders = ref<OrderRecordView[]>([])

function validate(): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '请输入正确的邮箱'
  if (!form.orderPassword.trim()) return '请输入订单密码'
  return ''
}

async function query() {
  const msg = validate()
  if (msg) {
    error.value = msg
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/orders/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, orderPassword: form.orderPassword }),
    })
    const body: ApiResponse<OrderRecordView[]> = await res.json()
    if (body.code !== 200) throw new Error(body.message)
    orders.value = body.data
    searched.value = true
  } catch (e) {
    error.value = (e as Error).message || '查询失败'
  } finally {
    loading.value = false
  }
}
//#endregion

//#region 展示辅助
const STATUS_TEXT: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  expired: '已失效',
}

function formatTime(ms: number): string {
  if (!ms) return '-'
  return new Date(ms).toLocaleString()
}
//#endregion
</script>

<template>
  <div class="query">
    <section class="form">
      <h2>订单查询</h2>
      <p class="hint">输入下单时填写的邮箱与订单密码，查询订单状态与卡密</p>
      <label class="field">
        <span>邮箱*</span>
        <input v-model="form.email" type="email" placeholder="下单时填写的邮箱" @keyup.enter="query" />
      </label>
      <label class="field">
        <span>订单密码*</span>
        <input
          v-model="form.orderPassword"
          type="password"
          placeholder="下单时设置的订单密码"
          @keyup.enter="query"
        />
      </label>
      <p v-if="error" class="err">{{ error }}</p>
      <button class="submit" :disabled="loading" @click="query">
        {{ loading ? '查询中...' : '查询订单' }}
      </button>
    </section>

    <section v-if="searched" class="result">
      <p v-if="orders.length === 0" class="tip">未查询到订单，请核对邮箱与订单密码</p>

      <article v-for="order in orders" :key="order.orderId" class="order-card">
        <div class="order-head">
          <span class="order-name">{{ order.productName }}</span>
          <span class="badge" :class="order.status">{{ STATUS_TEXT[order.status] }}</span>
        </div>
        <div class="order-meta">
          <span>数量 {{ order.quantity }}</span>
          <span>金额 ￥{{ order.totalAmount }}</span>
          <span>{{ formatTime(order.createdAt) }}</span>
        </div>
        <div class="order-no">订单号：{{ order.orderId }}</div>

        <div v-if="order.status === 'paid'" class="cards-wrap">
          <div class="cards-title">卡密</div>
          <ul class="cards">
            <li v-for="(c, i) in order.cards" :key="i">{{ c }}</li>
          </ul>
        </div>
        <p v-else class="cards-empty">
          {{ order.status === 'pending' ? '订单待支付，支付完成后可查看卡密' : '订单已失效' }}
        </p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.query {
  max-width: 640px;
  margin: 0 auto;
}

.form {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  background: var(--surface);
  margin-bottom: 24px;
}

.form h2 {
  font-size: 20px;
  margin-bottom: 6px;
}

.hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 18px;
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

.field input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
}

.err {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
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

.tip {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 0;
}

.order-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  background: var(--surface);
  margin-bottom: 16px;
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-name {
  font-size: 16px;
  font-weight: 600;
}

.badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.badge.paid {
  color: var(--success);
  background: var(--success-bg);
}

.badge.pending {
  color: var(--primary);
  background: var(--chip-bg);
}

.badge.expired {
  color: var(--text-faint);
  background: var(--chip-bg);
}

.order-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.order-no {
  font-size: 12px;
  color: var(--text-faint);
  word-break: break-all;
  margin-bottom: 12px;
}

.cards-title {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.cards {
  list-style: none;
  background: var(--chip-bg);
  border-radius: 6px;
  padding: 10px 12px;
  max-height: 220px;
  overflow-y: auto;
}

.cards li {
  font-family: monospace;
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-input);
  word-break: break-all;
}

.cards li:last-child {
  border-bottom: none;
}

.cards-empty {
  font-size: 13px;
  color: var(--text-faint);
}
</style>

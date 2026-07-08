<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ApiResponse, OrderStatusView } from '@webstore/shared'
import { API_BASE } from '@/config'

const route = useRoute()
const router = useRouter()

//#region 卡密状态轮询
const orderId = route.params.id as string
const token = (route.query.token as string) ?? ''
const status = ref<OrderStatusView['status']>('pending')
const cards = ref<string[]>([])
const loaded = ref(false)
const error = ref('')
let pollTimer: number | undefined

async function pollStatus() {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status?token=${token}`)
    const body: ApiResponse<OrderStatusView> = await res.json()
    if (body.code !== 200) {
      // 令牌无效或订单不存在：停止轮询并提示
      error.value = body.message || '无法获取订单信息'
      stopPolling()
      return
    }
    status.value = body.data.status
    loaded.value = true
    if (body.data.status === 'paid') {
      cards.value = body.data.cards ?? []
      stopPolling()
    } else if (body.data.status === 'expired') {
      stopPolling()
    }
  } catch {
    // 单次轮询失败忽略，等待下次
  }
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = undefined
}
//#endregion

//#region 操作
const copied = ref(false)

function copyAll() {
  // 一键复制全部卡密，换行分隔，便于用户保存
  navigator.clipboard?.writeText(cards.value.join('\n')).then(() => {
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1500)
  })
}

function goHome() {
  router.push('/')
}
//#endregion

onMounted(() => {
  pollStatus()
  pollTimer = window.setInterval(pollStatus, 2000)
})

onUnmounted(stopPolling)
</script>

<template>
  <div class="result">
    <div class="card">
      <template v-if="error">
        <div class="icon fail">×</div>
        <h2 class="fail-text">无法查看订单</h2>
        <p class="tip">{{ error }}</p>
        <div class="actions">
          <button class="btn primary" @click="goHome">返回首页</button>
        </div>
      </template>

      <template v-else-if="!loaded && status === 'pending'">
        <div class="icon spin">◌</div>
        <h2>正在确认支付结果</h2>
        <p class="tip">请稍候，正在与服务器确认订单状态...</p>
      </template>

      <template v-else-if="status === 'paid'">
        <div class="icon ok">✓</div>
        <h2 class="ok-text">支付成功，卡密如下</h2>
        <p class="tip">卡密已发货，同时发送至你的邮箱，请妥善保存</p>
        <ul class="cards">
          <li v-for="(c, i) in cards" :key="i">{{ c }}</li>
        </ul>
        <div class="order-no">订单号：{{ orderId }}</div>
        <div class="actions">
          <button class="btn primary" @click="copyAll">{{ copied ? '已复制' : '复制全部卡密' }}</button>
          <button class="btn" @click="goHome">返回首页</button>
        </div>
      </template>

      <template v-else-if="status === 'pending'">
        <div class="icon wait">…</div>
        <h2>等待支付</h2>
        <p class="tip">订单尚未支付完成，页面将自动刷新状态</p>
        <div class="order-no">订单号：{{ orderId }}</div>
      </template>

      <template v-else>
        <div class="icon fail">×</div>
        <h2 class="fail-text">订单已失效</h2>
        <p class="tip">超时未支付，库存已释放，请重新下单</p>
        <div class="actions">
          <button class="btn primary" @click="goHome">返回首页</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.result {
  max-width: 520px;
  margin: 0 auto;
  padding: 40px 0;
}

.card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 32px 24px;
  background: var(--surface);
  text-align: center;
}

.icon {
  width: 56px;
  height: 56px;
  line-height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  font-size: 28px;
}

.icon.ok {
  color: var(--success);
  background: var(--success-bg);
}

.icon.fail {
  color: var(--danger);
  background: var(--chip-bg);
}

.icon.wait,
.icon.spin {
  color: var(--primary);
  background: var(--chip-bg);
}

.icon.spin {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.card h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.ok-text {
  color: var(--success);
}

.fail-text {
  color: var(--danger);
}

.tip {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 16px;
}

.cards {
  list-style: none;
  text-align: left;
  background: var(--chip-bg);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  max-height: 260px;
  overflow-y: auto;
}

.cards li {
  font-family: monospace;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--border-input);
  word-break: break-all;
}

.cards li:last-child {
  border-bottom: none;
}

.order-no {
  font-size: 12px;
  color: var(--text-faint);
  word-break: break-all;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 9px 20px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}

.btn.primary {
  border: none;
  background: var(--primary);
  color: #fff;
}
</style>

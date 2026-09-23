<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Card, Product } from '@webstore/shared'
import { useAuth } from '@/composables/useAuth'

const { authFetch, hasPermission } = useAuth()

const canWrite = hasPermission('card:write')

//#region 商品选择
const products = ref<Product[]>([])
const selectedId = ref('')
const error = ref('')

async function loadProducts() {
  try {
    products.value = await authFetch<Product[]>('/admin/products')
  } catch (e) {
    error.value = (e as Error).message
  }
}
//#endregion

//#region 卡密与库存加载
const cards = ref<Card[]>([])
const stock = ref(0)
const loading = ref(false)

async function loadCards() {
  if (!selectedId.value) return
  loading.value = true
  error.value = ''
  try {
    // 卡密列表与库存并行加载
    const [cardList, stockRes] = await Promise.all([
      authFetch<Card[]>(`/admin/cards/product/${selectedId.value}`),
      authFetch<{ productId: string; stock: number }>(`/admin/cards/stock/${selectedId.value}`),
    ])
    cards.value = cardList
    stock.value = stockRes.stock
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
//#endregion

//#region 导入卡密
const secretsText = ref('')
const submitting = ref(false)
const formError = ref('')

async function addCards() {
  const secrets = secretsText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (secrets.length === 0) {
    formError.value = '请输入至少一条卡密（每行一条）'
    return
  }
  submitting.value = true
  formError.value = ''
  try {
    await authFetch<{ count: number }>('/admin/cards', {
      method: 'POST',
      body: JSON.stringify({ productId: selectedId.value, secrets }),
    })
    secretsText.value = ''
    await loadCards()
  } catch (e) {
    formError.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}
//#endregion

//#region 删除卡密
async function removeCard(card: Card) {
  try {
    await authFetch<{ deleted: boolean }>(`/admin/cards/${card.id}`, { method: 'DELETE' })
    await loadCards()
  } catch (e) {
    error.value = (e as Error).message
  }
}

const STATUS_TEXT: Record<Card['status'], string> = {
  unsold: '可售',
  locked: '锁定中',
  sold: '已售出',
}
//#endregion

onMounted(loadProducts)
</script>

<template>
  <div class="panel">
    <h2>卡密管理</h2>

    <section class="form-bar">
      <select v-model="selectedId" class="inp" @change="loadCards">
        <option value="" disabled>选择商品</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <span v-if="selectedId" class="stock">可售库存：{{ stock }}</span>
    </section>

    <section v-if="canWrite && selectedId" class="add-bar">
      <textarea
        v-model="secretsText"
        class="area"
        rows="3"
        placeholder="批量导入卡密，每行一条"
      ></textarea>
      <div class="add-actions">
        <button class="btn" :disabled="submitting" @click="addCards">
          {{ submitting ? '导入中...' : '导入卡密' }}
        </button>
        <span v-if="formError" class="err">{{ formError }}</span>
      </div>
    </section>

    <p v-if="!selectedId" class="tip">请先选择商品</p>
    <p v-else-if="loading" class="tip">加载中...</p>
    <p v-else-if="error" class="tip err">{{ error }}</p>
    <p v-else-if="cards.length === 0" class="tip">该商品暂无卡密</p>
    <table v-else class="table">
      <thead>
        <tr>
          <th>卡密</th>
          <th>状态</th>
          <th v-if="canWrite">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="card in cards" :key="card.id">
          <td class="mono">{{ card.secret }}</td>
          <td>
            <span class="badge" :class="card.status">{{ STATUS_TEXT[card.status] }}</span>
          </td>
          <td v-if="canWrite">
            <button class="link danger" @click="removeCard(card)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.panel h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.form-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.inp {
  padding: 8px 10px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
}

.stock {
  font-size: 14px;
  color: var(--success);
}

.add-bar {
  margin-bottom: 18px;
}

.area {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
  resize: vertical;
  margin-bottom: 8px;
}

.add-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn:disabled {
  background: #bbb;
  cursor: not-allowed;
}

.err {
  color: var(--danger);
  font-size: 13px;
}

.tip {
  color: var(--text-muted);
  padding: 24px 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.table th {
  color: var(--text-muted);
  font-weight: 600;
}

.mono {
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
}

.badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.badge.unsold {
  color: var(--success);
  background: var(--success-bg);
}

.badge.locked {
  color: var(--primary);
  background: var(--chip-bg);
}

.badge.sold {
  color: var(--text-faint);
  background: var(--chip-bg);
}

.link {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  color: var(--primary);
}

.link.danger {
  color: var(--danger);
}
</style>

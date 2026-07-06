<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ApiResponse, CategoryWithProducts } from '@webstore/shared'
import { API_BASE } from '@/config'

const router = useRouter()

function goDetail(id: string) {
  router.push(`/product/${id}`)
}

const categories = ref<CategoryWithProducts[]>([])
const loading = ref(true)
const error = ref('')

async function loadCatalog() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/catalog`)
    const body: ApiResponse<CategoryWithProducts[]> = await res.json()
    categories.value = body.data
  } catch (e) {
    error.value = '加载失败，请确认后端服务已启动'
  } finally {
    loading.value = false
  }
}

onMounted(loadCatalog)
</script>

<template>
  <div class="home">
    <p v-if="loading" class="tip">加载中...</p>
    <p v-else-if="error" class="tip error">{{ error }}</p>
    <p v-else-if="categories.length === 0" class="tip">暂无上架商品</p>

    <section v-for="category in categories" :key="category.id" class="category">
      <h2 class="category-title">{{ category.name }}</h2>
      <div class="product-grid">
        <article
          v-for="product in category.products"
          :key="product.id"
          class="product-card"
          @click="goDetail(product.id)"
        >
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-desc">{{ product.description || '暂无描述' }}</p>
          <div class="product-footer">
            <span class="price">￥{{ product.price }}</span>
            <span class="stock" :class="{ 'out-of-stock': product.stock === 0 }">
              {{ product.stock > 0 ? `库存 ${product.stock}` : '缺货' }}
            </span>
          </div>
        </article>
      </div>
    </section>
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

.category {
  margin-bottom: 32px;
}

.category-title {
  font-size: 18px;
  font-weight: 600;
  border-left: 4px solid var(--primary);
  padding-left: 10px;
  margin-bottom: 16px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-card {
  border: 1px solid var(--border-input);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  background: var(--surface);
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.product-name {
  font-size: 16px;
  margin-bottom: 8px;
}

.product-desc {
  font-size: 13px;
  color: var(--text-faint);
  min-height: 36px;
  margin-bottom: 12px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: var(--danger);
  font-weight: 600;
  font-size: 16px;
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
</style>

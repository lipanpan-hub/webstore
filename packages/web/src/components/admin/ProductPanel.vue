<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { AdminCreateProductInput, Category, Product, ProductStatus } from '@webstore/shared'
import { useAuth } from '@/composables/useAuth'

const { authFetch, hasPermission } = useAuth()

const canWrite = hasPermission('product:write')

//#region 列表与分类加载
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref('')

// 分类 ID -> 名称映射，用于列表展示所属分类
const categoryName = (id: string) => categories.value.find((c) => c.id === id)?.name ?? id

async function load() {
  loading.value = true
  error.value = ''
  try {
    // 商品与分类并行加载：分类既用于展示也用于新增表单下拉
    const [prodList, catList] = await Promise.all([
      authFetch<Product[]>('/admin/products'),
      authFetch<Category[]>('/admin/categories'),
    ])
    products.value = prodList
    categories.value = catList
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
//#endregion

//#region 新增商品
const form = reactive<AdminCreateProductInput>({
  categoryId: '',
  name: '',
  price: 0,
  description: '',
})
const submitting = ref(false)
const formError = ref('')

async function create() {
  if (!form.categoryId) {
    formError.value = '请选择分类'
    return
  }
  if (!form.name.trim()) {
    formError.value = '请输入商品名称'
    return
  }
  if (!(Number(form.price) > 0)) {
    formError.value = '请输入正确的价格'
    return
  }
  submitting.value = true
  formError.value = ''
  try {
    await authFetch<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: form.categoryId,
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description?.trim() ?? '',
      }),
    })
    form.name = ''
    form.price = 0
    form.description = ''
    await load()
  } catch (e) {
    formError.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}
//#endregion

//#region 上架/下架
async function toggleStatus(p: Product) {
  const next: ProductStatus = p.status === 'on' ? 'off' : 'on'
  try {
    await authFetch<Product>(`/admin/products/${p.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    })
    p.status = next
  } catch (e) {
    error.value = (e as Error).message
  }
}
//#endregion

//#region 编辑详情
const editingId = ref('')
const detailDraft = ref('')

function startEdit(p: Product) {
  editingId.value = p.id
  detailDraft.value = p.detail ?? ''
}

function cancelEdit() {
  editingId.value = ''
  detailDraft.value = ''
}

async function saveDetail(p: Product) {
  try {
    await authFetch<Product>(`/admin/products/${p.id}/detail`, {
      method: 'PATCH',
      body: JSON.stringify({ detail: detailDraft.value }),
    })
    p.detail = detailDraft.value
    cancelEdit()
  } catch (e) {
    error.value = (e as Error).message
  }
}
//#endregion

onMounted(load)
</script>

<template>
  <div class="panel">
    <h2>商品管理</h2>

    <section v-if="canWrite" class="form-bar">
      <select v-model="form.categoryId" class="inp">
        <option value="" disabled>选择分类</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <input v-model="form.name" class="inp" type="text" placeholder="商品名称" />
      <input v-model.number="form.price" class="inp price" type="number" placeholder="价格" />
      <input v-model="form.description" class="inp" type="text" placeholder="描述（可选）" />
      <button class="btn" :disabled="submitting" @click="create">
        {{ submitting ? '提交中...' : '新增商品' }}
      </button>
      <span v-if="formError" class="err">{{ formError }}</span>
    </section>

    <p v-if="loading" class="tip">加载中...</p>
    <p v-else-if="error" class="tip err">{{ error }}</p>
    <p v-else-if="products.length === 0" class="tip">暂无商品</p>
    <table v-else class="table">
      <thead>
        <tr>
          <th>名称</th>
          <th>分类</th>
          <th>价格</th>
          <th>状态</th>
          <th v-if="canWrite">操作</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="p in products" :key="p.id">
          <tr>
            <td>{{ p.name }}</td>
            <td>{{ categoryName(p.categoryId) }}</td>
            <td>￥{{ p.price }}</td>
            <td>
              <span class="badge" :class="p.status">{{ p.status === 'on' ? '已上架' : '已下架' }}</span>
            </td>
            <td v-if="canWrite" class="actions">
              <button class="link" @click="toggleStatus(p)">
                {{ p.status === 'on' ? '下架' : '上架' }}
              </button>
              <button class="link" @click="startEdit(p)">编辑详情</button>
            </td>
          </tr>
          <tr v-if="editingId === p.id">
            <td :colspan="canWrite ? 5 : 4">
              <div class="editor">
                <textarea v-model="detailDraft" class="area" rows="4" placeholder="商品详情"></textarea>
                <div class="editor-actions">
                  <button class="btn" @click="saveDetail(p)">保存</button>
                  <button class="btn ghost" @click="cancelEdit">取消</button>
                </div>
              </div>
            </td>
          </tr>
        </template>
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
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.inp {
  padding: 8px 10px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
}

.inp.price {
  width: 100px;
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

.btn.ghost {
  background: var(--chip-bg);
  color: var(--text);
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

.badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.badge.on {
  color: var(--success);
  background: var(--success-bg);
}

.badge.off {
  color: var(--text-faint);
  background: var(--chip-bg);
}

.actions {
  display: flex;
  gap: 12px;
}

.link {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.editor {
  padding: 8px 0;
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

.editor-actions {
  display: flex;
  gap: 10px;
}
</style>

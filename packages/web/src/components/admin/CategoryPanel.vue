<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { AdminCreateCategoryInput, Category } from '@webstore/shared'
import { useAuth } from '@/composables/useAuth'

const { authFetch, hasPermission } = useAuth()

// 是否具备写权限：无写权限时隐藏新增表单，仅可查看
const canWrite = hasPermission('category:write')

//#region 列表加载
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await authFetch<Category[]>('/admin/categories')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
//#endregion

//#region 新增分类
const form = reactive<AdminCreateCategoryInput>({ name: '', sort: 0 })
const submitting = ref(false)
const formError = ref('')

async function create() {
  if (!form.name.trim()) {
    formError.value = '请输入分类名称'
    return
  }
  submitting.value = true
  formError.value = ''
  try {
    await authFetch<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: form.name.trim(), sort: Number(form.sort) || 0 }),
    })
    form.name = ''
    form.sort = 0
    await load()
  } catch (e) {
    formError.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}
//#endregion

onMounted(load)
</script>

<template>
  <div class="panel">
    <h2>分类管理</h2>

    <section v-if="canWrite" class="form-bar">
      <input v-model="form.name" class="inp" type="text" placeholder="分类名称" />
      <input v-model.number="form.sort" class="inp sort" type="number" placeholder="排序" />
      <button class="btn" :disabled="submitting" @click="create">
        {{ submitting ? '提交中...' : '新增分类' }}
      </button>
      <span v-if="formError" class="err">{{ formError }}</span>
    </section>

    <p v-if="loading" class="tip">加载中...</p>
    <p v-else-if="error" class="tip err">{{ error }}</p>
    <p v-else-if="categories.length === 0" class="tip">暂无分类</p>
    <table v-else class="table">
      <thead>
        <tr>
          <th>名称</th>
          <th>排序</th>
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in categories" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ c.sort }}</td>
          <td class="mono">{{ c.id }}</td>
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

.inp.sort {
  width: 90px;
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
  font-size: 12px;
  color: var(--text-faint);
}
</style>

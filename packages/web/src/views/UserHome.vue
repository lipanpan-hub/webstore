<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import AdminSidebar, { type MenuItem } from '@/components/admin/AdminSidebar.vue'
import OverviewPanel from '@/components/admin/OverviewPanel.vue'
import CategoryPanel from '@/components/admin/CategoryPanel.vue'
import ProductPanel from '@/components/admin/ProductPanel.vue'
import CardPanel from '@/components/admin/CardPanel.vue'
import { useAuth } from '@/composables/useAuth'

const { hasPermission } = useAuth()

// 菜单项定义：permission 为空表示所有登录用户可见；否则需命中对应权限点
// 每项绑定其面板组件，右侧按选中项动态挂载
interface MenuEntry extends MenuItem {
  permission?: string
  panel: Component
}

const ALL_MENUS: MenuEntry[] = [
  { key: 'overview', label: '概览', icon: '🏠', panel: OverviewPanel },
  { key: 'category', label: '分类管理', icon: '📁', permission: 'category:read', panel: CategoryPanel },
  { key: 'product', label: '商品管理', icon: '📦', permission: 'product:read', panel: ProductPanel },
  { key: 'card', label: '卡密管理', icon: '🎫', permission: 'card:read', panel: CardPanel },
]

// 按权限过滤出当前用户可见的菜单
const menus = computed(() => ALL_MENUS.filter((m) => !m.permission || hasPermission(m.permission)))

const active = ref('overview')
const collapsed = ref(false)

// 当前选中菜单对应的面板组件，用 <component :is> 动态挂载
const activePanel = computed<Component>(() => {
  const found = menus.value.find((m) => m.key === active.value)
  return found?.panel ?? OverviewPanel
})

function select(key: string) {
  active.value = key
}
</script>

<template>
  <div class="user-home">
    <AdminSidebar
      :items="menus"
      :active="active"
      :collapsed="collapsed"
      @select="select"
      @toggle-collapse="collapsed = !collapsed"
    />
    <section class="content">
      <component :is="activePanel" />
    </section>
  </div>
</template>

<style scoped>
.user-home {
  display: flex;
  min-height: calc(100vh - 120px);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-x: auto;
}
</style>

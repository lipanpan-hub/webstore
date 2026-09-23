<script setup lang="ts">
// 可折叠导航栏：受控组件，菜单项/折叠态/选中项由父组件传入，交互通过事件上抛
export interface MenuItem {
  key: string
  label: string
  icon: string
}

defineProps<{
  items: MenuItem[]
  active: string
  collapsed: boolean
}>()

const emit = defineEmits<{
  select: [key: string]
  'toggle-collapse': []
}>()
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <button class="collapse-btn" :title="collapsed ? '展开' : '收起'" @click="emit('toggle-collapse')">
      {{ collapsed ? '»' : '«' }}
    </button>
    <nav class="menu">
      <button
        v-for="item in items"
        :key="item.key"
        class="menu-item"
        :class="{ active: item.key === active }"
        :title="item.label"
        @click="emit('select', item.key)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span v-if="!collapsed" class="label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--surface);
  transition: width 0.2s;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 56px;
}

.collapse-btn {
  align-self: flex-end;
  margin: 8px;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

.menu-item:hover {
  background: var(--chip-bg);
}

.menu-item.active {
  background: var(--primary);
  color: #fff;
}

.icon {
  font-size: 16px;
  flex-shrink: 0;
}

.collapsed .menu-item {
  justify-content: center;
  padding: 10px 0;
}
</style>

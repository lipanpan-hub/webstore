<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

// 概览面板：展示当前登录用户的账号信息、角色与权限点
const { user } = useAuth()
</script>

<template>
  <div class="overview">
    <h2>概览</h2>
    <div v-if="user" class="info">
      <div class="row">
        <span class="key">用户名</span>
        <span class="val">{{ user.username }}</span>
      </div>
      <div class="row">
        <span class="key">状态</span>
        <span class="val">{{ user.status === 'active' ? '正常' : '已停用' }}</span>
      </div>
      <div class="row">
        <span class="key">角色</span>
        <span class="val">
          <span v-for="r in user.roles" :key="r" class="chip">{{ r }}</span>
          <span v-if="user.roles.length === 0" class="faint">无</span>
        </span>
      </div>
      <div class="row">
        <span class="key">权限点</span>
        <span class="val">
          <span v-for="p in user.permissions" :key="p" class="chip">{{ p }}</span>
          <span v-if="user.permissions.length === 0" class="faint">无</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.info {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 8px 16px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: none;
}

.key {
  width: 80px;
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.val {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 14px;
}

.chip {
  background: var(--chip-bg);
  border-radius: 10px;
  padding: 2px 10px;
  font-size: 12px;
}

.faint {
  color: var(--text-faint);
}
</style>

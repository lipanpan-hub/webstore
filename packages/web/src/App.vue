<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<template>
  <div id="web-app">
    <header class="web-header">
      <h1>WebStore</h1>
      <nav class="web-nav">
        <router-link to="/">首页</router-link>
        <router-link to="/query">订单查询</router-link>
      </nav>
      <button
        class="theme-toggle"
        :title="theme === 'light' ? '切换到暗色' : '切换到亮色'"
        @click="toggle"
      >
        {{ theme === 'light' ? '🌙 暗色' : '☀️ 亮色' }}
      </button>
    </header>
    <main class="web-main">
      <router-view />
    </main>
  </div>
</template>

<style>
:root {
  --bg: #fff;
  --surface: #fff;
  --text: #333;
  --text-muted: #888;
  --text-faint: #999;
  --border: #eee;
  --border-input: #ddd;
  --primary: #4a90d9;
  --danger: #e05353;
  --success: #52a852;
  --success-bg: #eef7ee;
  --chip-bg: #f2f2f2;
  --header-bg: #4a90d9;
  --header-text: #fff;
}

:root[data-theme='dark'] {
  --bg: #1a1a1a;
  --surface: #242424;
  --text: #e6e6e6;
  --text-muted: #9a9a9a;
  --text-faint: #7d7d7d;
  --border: #3a3a3a;
  --border-input: #444;
  --primary: #4a90d9;
  --danger: #f06b6b;
  --success: #5fbf5f;
  --success-bg: #23331f;
  --chip-bg: #333;
  --header-bg: #2a3a4d;
  --header-text: #f0f0f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: var(--text);
  background: var(--bg);
  transition: background 0.2s, color 0.2s;
}

.web-header {
  background: var(--header-bg);
  color: var(--header-text);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.web-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.web-nav {
  display: flex;
  gap: 20px;
}

.web-nav a {
  color: var(--header-text);
  text-decoration: none;
  opacity: 0.85;
}

.web-nav a:hover {
  opacity: 1;
}

.theme-toggle {
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: var(--header-text);
  font-size: 13px;
  cursor: pointer;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.25);
}

.web-main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

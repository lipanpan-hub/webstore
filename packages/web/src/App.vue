<script setup lang="ts">
</script>

<template>
  <div id="web-app">
    <header class="web-header">
      <h1>WebStore</h1>
      <nav class="web-nav">
        <router-link to="/">首页</router-link>
      </nav>
    </header>
    <main class="web-main">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  background: #fff;
}

.web-header {
  background: #4a90d9;
  color: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.web-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.web-nav a {
  color: #fff;
  text-decoration: none;
  opacity: 0.85;
}

.web-nav a:hover {
  opacity: 1;
}

.web-main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

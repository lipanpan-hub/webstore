<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

function validate(): string {
  if (!form.username.trim()) return '请输入用户名'
  if (!form.password) return '请输入密码'
  return ''
}

async function submit() {
  const msg = validate()
  if (msg) {
    error.value = msg
    return
  }
  loading.value = true
  error.value = ''
  try {
    await login({ username: form.username.trim(), password: form.password })
    router.push('/home')
  } catch (e) {
    error.value = (e as Error).message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <section class="card">
      <h2>登录</h2>
      <p class="hint">登录后进入个人后台，按权限进行管理操作</p>
      <label class="field">
        <span>用户名</span>
        <input v-model="form.username" type="text" placeholder="用户名" @keyup.enter="submit" />
      </label>
      <label class="field">
        <span>密码</span>
        <input v-model="form.password" type="password" placeholder="密码" @keyup.enter="submit" />
      </label>
      <p v-if="error" class="err">{{ error }}</p>
      <button class="submit" :disabled="loading" @click="submit">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <p class="switch">
        还没有账号？
        <router-link to="/register">立即注册</router-link>
      </p>
    </section>
  </div>
</template>

<style scoped>
.auth {
  max-width: 420px;
  margin: 40px auto 0;
}

.card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  background: var(--surface);
}

.card h2 {
  font-size: 20px;
  margin-bottom: 6px;
}

.hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.field {
  display: block;
  margin-bottom: 14px;
}

.field > span {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.field input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
}

.err {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
}

.submit {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}

.submit:disabled {
  background: #bbb;
  cursor: not-allowed;
}

.switch {
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

.switch a {
  color: var(--primary);
  text-decoration: none;
}
</style>

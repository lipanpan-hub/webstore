import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'webstore-theme'

// 模块级单例：整个应用共享同一份主题状态
const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || 'light')

function apply(value: Theme) {
  // 通过 html 上的 data-theme 属性驱动全局 CSS 变量切换
  document.documentElement.setAttribute('data-theme', value)
}

apply(theme.value)

watch(theme, (value) => {
  localStorage.setItem(STORAGE_KEY, value)
  apply(value)
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  return { theme, toggle }
}

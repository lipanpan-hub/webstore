import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/product/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetail.vue'),
    },
    {
      path: '/result/:id',
      name: 'order-result',
      component: () => import('@/views/OrderResult.vue'),
    },
    {
      path: '/query',
      name: 'order-query',
      component: () => import('@/views/OrderQuery.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
    },
    {
      path: '/home',
      name: 'user-home',
      component: () => import('@/views/UserHome.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 全局前置守卫：受保护路由未登录时跳转登录页
router.beforeEach((to) => {
  const { isLoggedIn } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login' }
  }
  return true
})

export default router

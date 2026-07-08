import { createRouter, createWebHistory } from 'vue-router'

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
  ],
})

export default router

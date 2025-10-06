import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'log in',
      component: () => import('../views/LogInView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/signUp',
      name: 'sign up',
      component: () => import('../views/SignUpView.vue'),
      meta: { requiresGuest: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Проверяем аутентификацию при первом посещении
  if (!authStore.user && authStore.token) {
    await authStore.checkAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  } 
})
export default router

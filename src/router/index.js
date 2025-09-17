import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const Home       = () => import('@/pages/Home.vue')
const Services   = () => import('@/pages/Services.vue')
const Cart       = () => import('@/pages/Cart.vue')
const Checkout   = () => import('@/pages/Checkout.vue')
const Login      = () => import('@/pages/Login.vue')
const MyBookings = () => import('@/pages/MyBookings.vue')
const MyCleaning  = () => import('@/pages/Mycleaning.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',            name: 'home',         component: Home },
    { path: '/services',    name: 'services',     component: Services },
    { path: '/cart',        name: 'cart',         component: Cart },
    { path: '/checkout',    name: 'checkout',     component: Checkout,  meta: { requiresAuth: true } },
    { path: '/login',       name: 'login',        component: Login,     meta: { guestOnly: true } },
    { path: '/my-bookings', name: 'my-bookings',  component: MyBookings,meta: { requiresAuth: true } },
    { path: '/my-cleaning', name: 'my-cleaning',  component: MyCleaning,meta: { requiresAuth: true } },
  ]
})

// ✅ Simple auth guard (fixed)
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const isLoggedIn = !!auth.token || !!auth.user

  if (to.meta?.requiresAuth && !isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  if (to.meta?.guestOnly && isLoggedIn) {
    return next({ name: 'home' })
  }
  return next()
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const Home       = () => import('@/pages/Home.vue')
const Services   = () => import('@/pages/Services.vue')
const Cart       = () => import('@/pages/Cart.vue')
const Checkout   = () => import('@/pages/Checkout.vue')
const Login      = () => import('@/pages/Login.vue')
const MyBookings = () => import('@/pages/MyBookings.vue')
const MyCleaning = () => import('@/pages/MyCleaning.vue')

function isCleaner(user: any) {
  if (!user) return false
  if (user.role) return String(user.role).toLowerCase() === 'cleaner'
  if (Array.isArray(user.roles)) return user.roles.map((r: string) => r.toLowerCase()).includes('cleaner')
  return !!user.cleanerId // fallback
}
function isCustomer(user: any) {
  if (!user) return false
  if (user.role) return String(user.role).toLowerCase() === 'customer'
  if (Array.isArray(user.roles)) return user.roles.map((r: string) => r.toLowerCase()).includes('customer')
  return !!user.customerId // fallback
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',            name: 'home',        component: Home },
    { path: '/services',    name: 'services',    component: Services },
    { path: '/cart',        name: 'cart',        component: Cart },
    { path: '/checkout',    name: 'checkout',    component: Checkout, meta: { requiresAuth: true } },
    { path: '/login',       name: 'login',       component: Login },
    { path: '/my-bookings', name: 'my-bookings', component: MyBookings, meta: { requiresAuth: true, role: 'customer' } },
    { path: '/my-cleaning', name: 'my-cleaning', component: MyCleaning, meta: { requiresAuth: true, role: 'cleaner' } },
  ]
})

// Global guard (auth + role)
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuth) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.role && auth.isAuth) {
    const u = auth.user
    if (to.meta.role === 'cleaner' && !isCleaner(u)) {
      return next({ name: 'my-bookings' })
    }
    if (to.meta.role === 'customer' && !isCustomer(u)) {
      return next({ name: 'my-cleaning' })
    }
  }

  next()
})

export default router

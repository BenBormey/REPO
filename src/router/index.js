import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const Home       = () => import('@/pages/Home.vue')
const Services   = () => import('@/pages/Services.vue')
const Cart       = () => import('@/pages/Cart.vue')
const Checkout   = () => import('@/pages/Checkout.vue')
const Login      = () => import('@/pages/Login.vue')
const MyBookings = () => import('@/pages/MyBookings.vue')
const MyCleaning = () => import('@/pages/MyCleaning.vue') // <-- fix casing

// Admin
const AdminLayout    = () => import('@/layouts/AdminLayout.vue')
const AdminDashboard = () => import('@/pages/admin/Dashboard.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',            name: 'home',         component: Home },
    { path: '/services',    name: 'services',     component: Services },
    { path: '/cart',        name: 'cart',         component: Cart },
    { path: '/checkout',    name: 'checkout',     component: Checkout, meta: { requiresAuth: true } },
    { path: '/login',       name: 'login',        component: Login,     meta: { guestOnly: true } },
    { path: '/my-bookings', name: 'my-bookings',  component: MyBookings,meta: { requiresAuth: true } },
    { path: '/my-cleaning', name: 'my-cleaning',  component: MyCleaning,meta: { requiresAuth: true } },

    // ✅ Admin parent with children
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true }, // add role: 'admin' if you want
      children: [
        { path: 'dashboard', name: 'admin-dashboard', component: AdminDashboard }
      ]
    },
  ]
})

// ✅ Simple auth guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const isLoggedIn = !!auth.token || !!auth.user

  if (to.meta?.requiresAuth && !isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  if (to.meta?.guestOnly && isLoggedIn) {
    return next({ name: 'home' })
  }
  next()
})

export default router

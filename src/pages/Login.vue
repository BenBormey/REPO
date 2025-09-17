<template>
  <div class="min-h-[60vh] grid place-items-center px-4">
    <div class="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
      <h1 class="text-2xl font-semibold">Welcome Back</h1>
      <p class="text-sm text-gray-500 mb-6">Sign in to your account</p>

      <form @submit.prevent="onLogin" class="space-y-4">
        <div>
          <label class="label">Email</label>
          <input v-model.trim="email" type="email" class="input" placeholder="Enter your email" required />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model.trim="password" type="password" class="input" placeholder="Enter your password" required />
        </div>

        <button class="btn-primary w-full" type="submit" :disabled="loading">
          {{ loading ? 'Signing In…' : 'Sign In' }}
        </button>
      </form>

      <p class="text-sm text-gray-500 mt-4">
        Don’t have an account? <router-link class="text-blue-600 hover:underline" to="/register">Sign up</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)

function isCleaner(user: any) {
  if (!user) return false
  if (user.role) return String(user.role).toLowerCase() === 'cleaner'
  if (Array.isArray(user.roles)) return user.roles.map((r: string) => r.toLowerCase()).includes('cleaner')
  return !!user.cleanerId
}

async function onLogin() {
  loading.value = true
  try {
    const res = await api.post('/Auth/Login', { email: email.value, password: password.value })
    auth.login(res.data) // assume your store sets isAuth and user
    const redirect = route.query.redirect as string | undefined
    if (redirect) router.push(redirect)
    else if (isCleaner(auth.user)) router.push({ name: 'my-cleaning' })
    else router.push({ name: 'my-bookings' })
  } catch (e: any) {
    alert(e?.response?.data?.title || e?.message || 'Login failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 12px; }
.label { font-size: 0.875rem; color: #6b7280; }
.btn-primary { padding: 10px 14px; border-radius: 12px; background: linear-gradient(90deg,#2563eb,#1d4ed8); color: white; }
</style>

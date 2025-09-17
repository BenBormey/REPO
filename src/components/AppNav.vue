<template>
  <nav class="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <router-link to="/" class="font-semibold">Clinara</router-link>
      <div class="flex items-center gap-4">
        <router-link to="/" class="link" active-class="active">Home</router-link>
        <router-link to="/services" class="link" active-class="active">Services</router-link>
        <router-link to="/cart" class="link" active-class="active">Cart</router-link>
        <router-link v-if="auth.isAuth && isCleaner(auth.user)" to="/my-cleaning" class="link" active-class="active">My Cleaning</router-link>
        <router-link v-else-if="auth.isAuth" to="/my-bookings" class="link" active-class="active">My Bookings</router-link>
        <router-link v-else to="/login" class="link">Login</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
function isCleaner(user: any) {
  if (!user) return false
  if (user.role) return String(user.role).toLowerCase() === 'cleaner'
  if (Array.isArray(user.roles)) return user.roles.map((r: string) => r.toLowerCase()).includes('cleaner')
  return !!user.cleanerId
}
</script>

<style scoped>
.link { color: #111827; }
.link:hover { text-decoration: underline; }
.active { text-decoration: underline; font-weight: 600; }
</style>

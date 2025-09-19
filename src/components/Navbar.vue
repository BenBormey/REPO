<template>
  <header class="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Logo -->
      <router-link class="font-semibold text-lg flex items-center gap-2" to="/">
        <span class="inline-block rounded bg-blue-600 text-white w-7 h-7 text-center leading-7">🧼</span>
        CleanCity
      </router-link>

      <!-- Nav links -->
      <nav class="hidden sm:flex items-center gap-5 text-sm">
        <router-link class="hover:text-blue-600" to="/services">Services</router-link>
        <router-link class="hover:text-blue-600" to="/cart">Cart</router-link>

        <!-- Show only to customers -->
        <router-link
          v-if="isCustomer"
          class="hover:text-blue-600"
          to="/my-bookings">
          My Bookings
        </router-link>

        <!-- Show only to cleaners -->
        <router-link
          v-if="isCleaner"
          class="hover:text-blue-600"
          to="/my-cleaning">
          My Cleaning
        </router-link>

        <!-- Show only to admins -->
        <router-link
          v-if="isAdmin"
          class="hover:text-blue-600"
          to="/admin/dashboard">
          Dashboard
        </router-link>
      </nav>

      <!-- Auth buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="isLoggedIn"
          @click="logout"
          class="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm">
          Logout
        </button>

        <router-link
          v-else
          class="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm"
          to="/login">
          Sign in
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

// Use token-based flag from your Pinia store
const isLoggedIn = computed(() => auth.isAuth)

// Normalize roles as array
const roles = computed(() => Array.isArray(auth.user?.roles) ? auth.user.roles : [])

// Role helpers
const isCleaner  = computed(() => roles.value.includes('Cleaner'))
const isCustomer = computed(() => roles.value.includes('Customer'))
const isAdmin    = computed(() => roles.value.includes('Admin'))

function logout () {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <Navbar />
    <main class="flex-1 pb-10">
      <router-view />
    </main>
    <footer class="border-t py-6 text-center text-sm text-gray-500">
      © {{ year }} CleanCity — Professional Cleaning Services
    </footer>
  </div>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue'

const year = new Date().getFullYear()
</script>

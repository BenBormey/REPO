<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-gray-800 text-white flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      ]"
    >
      <!-- Header -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-gray-700">
        <span v-if="sidebarOpen" class="font-bold text-lg">Admin</span>
        <button @click="sidebarOpen = !sidebarOpen" class="p-2 hover:bg-gray-700 rounded">
          <span v-if="sidebarOpen">❮</span>
          <span v-else>❯</span>
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 p-4 space-y-2">
        <router-link
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded transition-colors"
          active-class="bg-blue-600 text-white"
          exact
        >
          <span>{{ item.icon }}</span>
          <span v-if="sidebarOpen">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Content -->
    <main class="flex-1 bg-gray-50 p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";

const sidebarOpen = ref(true);

const menu = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "📊" },
  { label: "Services", to: "/admin/services", icon: "🛠" },
  { label: "Bookings", to: "/admin/bookings", icon: "📅" },
  
  { label: "Cleaners", to: "/admin/cleaners", icon: "🧹" },
];
</script>

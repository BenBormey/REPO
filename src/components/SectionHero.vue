<template>
  <section class="relative overflow-hidden">
    <div class="absolute inset-0">
      <img :src="bg" class="w-full h-full object-cover" alt="" />
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-black/60"></div>
    </div>
    <div class="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 text-white">
      <nav class="text-sm/6 opacity-90">
        <router-link to="/" class="hover:underline">Home</router-link>
        <span class="mx-2">/</span>
        <span>{{ subtitle }}</span>
      </nav>
      <h1 class="text-4xl sm:text-5xl font-extrabold mt-2">{{ title }}</h1>
      <p v-if="desc" class="max-w-2xl mt-3 text-white/90">{{ desc }}</p>
      <div v-if="$slots.actions" class="mt-6 flex gap-3">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Our Services' },
  subtitle: { type: String, default: 'Services' },
  desc: { type: String, default: '' },
  bg: { type: String, default: 'https://images.unsplash.com/photo-1603715749723-b6e76f9f8aaf?q=80&w=1600&auto=format&fit=crop' }
})
</script>

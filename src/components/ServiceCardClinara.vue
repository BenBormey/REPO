<template>
  <article class="group bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-lg transition">
    <div class="relative">
      <img :src="thumb(imageUrl)" alt="" class="w-full h-48 object-cover" />
      <div class="absolute -bottom-6 left-6">
        <div class="w-12 h-12 rounded-full bg-blue-600 text-white grid place-items-center shadow-lg">
          <span class="text-xl">🧽</span>
        </div>
      </div>
    </div>
    <div class="pt-8 px-6 pb-6">
      <h3 class="text-lg font-semibold group-hover:text-blue-600 transition">{{ title }}</h3>
      <p v-if="desc" class="text-sm text-gray-600 mt-1 line-clamp-3">{{ desc }}</p>
      <div class="mt-4 flex items-center justify-between text-sm">
        <div class="text-gray-700 font-semibold">${{ price.toFixed(2) }} <span class="text-gray-400 font-normal">/ {{ duration }} min</span></div>
        <router-link :to="detailsTo" class="text-blue-600 hover:underline">Read More →</router-link>
      </div>
      <div class="mt-4">
        <router-link :to="'/checkout?serviceId=' + id" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          Book Now
        </router-link>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  id: Number,
  title: String,
  desc: String,
  price: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  detailsTo: { type: [String, Object], default: '/services' }
})

const FILE_BASE = import.meta.env.VITE_FILE_BASE || 'http://localhost:7164'
const thumb = (p) => !p ? 'https://placehold.co/600x400?text=Service' : (p.startsWith('http') ? p : FILE_BASE + p)
</script>

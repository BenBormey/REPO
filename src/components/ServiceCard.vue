<template>
  <div class="card p-4 flex flex-col gap-2">
    <img :src="service.image" alt="" class="w-full h-40 object-cover rounded-xl" />
    <h3 class="font-semibold">{{ service.name }}</h3>
    <p class="text-sm text-gray-600 line-clamp-3">{{ service.description }}</p>
    <p class="mt-1"><b>${{ money(service.price) }}</b> · {{ service.durationMinutes }} min</p>
    <div class="mt-2 flex gap-2">
      <button class="btn btn-primary" @click="$emit('add', service)">Add to Cart</button>
      <router-link class="btn btn-outline" :to="`/booking?serviceId=${service.id}`">Book Now</router-link>
    </div>
  </div>
</template>

<script setup>
defineProps({
  service: { type: Object, required: true }
})
const money = (n) => Number(n ?? 0).toFixed(2)
</script>

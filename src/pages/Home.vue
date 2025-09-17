<template>
  <section class="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-10 items-center">
    <div>
      <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
        Sparkling clean spaces,<br class="hidden md:block"/> right on schedule.
      </h1>
      <p class="mt-4 text-gray-600 max-w-prose">
        Trusted cleaning for homes and offices. Eco‑friendly products, vetted cleaners, and flexible scheduling.
      </p>
      <div class="mt-6 flex gap-3">
        <router-link to="/services" class="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold">Browse Services</router-link>
        <router-link to="/checkout" class="px-4 py-2 rounded-md border">Book Now</router-link>
      </div>
      <ul class="mt-6 text-sm text-gray-600 grid sm:grid-cols-3 gap-2">
        <li>✅ Eco‑friendly</li>
        <li>✅ Vetted cleaners</li>
        <li>✅ Clear pricing</li>
      </ul>
    </div>
    <div class="bg-white rounded-2xl shadow p-4">
      <img class="rounded-xl w-full h-[320px] object-cover" src="https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?q=80&w=1600&auto=format&fit=crop" alt="Clean living room">
    </div>
  </section>
  <section class="max-w-6xl mx-auto px-4">
    <h2 class="text-2xl font-bold mb-4">Popular Services</h2>
    <ServicesGrid />
  </section>
</template>

<script setup>
import ServicesGrid from '@/components/ServicesGrid.vue'
</script>

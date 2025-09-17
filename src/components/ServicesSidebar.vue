<template>
  <aside class="space-y-6">
    <div class="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white">
      <h3 class="text-xl font-semibold">Schedule An Appointment</h3>
      <p class="mt-1 text-white/90 text-sm">Reliable cleaning solutions for a healthier, brighter space.</p>
      <router-link to="/checkout" class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-blue-700 font-semibold">Book Now</router-link>
    </div>

    <div class="p-6 rounded-2xl bg-white ring-1 ring-black/5">
      <h3 class="text-lg font-semibold">Contact Us</h3>
      <ul class="mt-3 text-sm text-gray-700 space-y-1.5">
        <li><strong>Address:</strong> {{ address }}</li>
        <li><strong>Opening Hour:</strong> {{ opening }}</li>
        <li><strong>Email:</strong> <a :href="'mailto:' + email" class="text-blue-600 hover:underline">{{ email }}</a></li>
        <li><strong>Phone:</strong> <a :href="'tel:' + phone" class="text-blue-600 hover:underline">{{ phone }}</a></li>
      </ul>
    </div>

    <div class="p-6 rounded-2xl bg-white ring-1 ring-black/5">
      <h3 class="text-lg font-semibold">Services Links</h3>
      <ul class="mt-3 text-sm space-y-1">
        <li v-for="s in links" :key="s.title">
          <router-link class="text-blue-600 hover:underline" :to="s.to">{{ s.title }}</router-link>
        </li>
      </ul>
    </div>

    <div class="p-6 rounded-2xl bg-white ring-1 ring-black/5">
      <h3 class="text-lg font-semibold">Subscribe Newsletter</h3>
      <p class="text-sm text-gray-600">Get updates on new services & offers. No spam.</p>
      <form @submit.prevent="$emit('subscribe', emailInput)">
        <input v-model="emailInput" type="email" placeholder="you@mail.com" required class="mt-3 w-full border rounded-md px-3 py-2" />
        <button class="mt-2 w-full px-3 py-2 rounded-md bg-blue-600 text-white">Subscribe</button>
      </form>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  address: { type: String, default: '231, Salt Lake city Avenue Utah City Mall, United States' },
  opening: { type: String, default: 'Mon–Sat 9:00 – 7:00' },
  email:   { type: String, default: 'info@clinaracare.com' },
  phone:   { type: String, default: '+99 213 667789' },
  links:   { type: Array,  default: () => [] }
})

const emailInput = ref('')
</script>

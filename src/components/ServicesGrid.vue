<template>
  <section class="max-w-6xl mx-auto px-4 py-12">
    <h2 class="text-2xl font-bold mb-6">Popular Services</h2>

    <div v-if="loading" class="py-8">Loading services…</div>
    <div v-else-if="error" class="py-4 text-red-600">{{ error }}</div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <ServiceCard
        v-for="s in list"
        :key="s.id"
        :service="s"
        @add="addToCart"
      />
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 z-50 bg-black text-white/90 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
      >
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">🛒</span>
        <div>
          <div class="font-medium">Added to cart</div>
          <div class="text-sm opacity-80 truncate max-w-[220px]">{{ lastAdded }}</div>
        </div>
        <button class="ml-2 underline text-sm" @click="goCart">View cart</button>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ServiceCard from '@/components/ServiceCard.vue'
import { useCartStore } from '@/stores/cart'
import api from '@/services/api'

const list = ref([])
const loading = ref(false)
const error = ref('')

const cart = useCartStore()
const router = useRouter()

const showToast = ref(false)
const lastAdded = ref('')
let toastTimer

const FILE_BASE = import.meta.env.VITE_FILE_BASE || 'http://localhost:5203'

function normalize(srv) {
  const img = !srv?.imageUrl
    ? 'https://placehold.co/600x400?text=No+Image'
    : (srv.imageUrl.startsWith('http') ? srv.imageUrl : `${FILE_BASE}${srv.imageUrl}`)
  return {
    id: srv.serviceId,
    name: srv.name,
    description: srv.description,
    price: Number(srv.price ?? 0),
    durationMinutes: srv.durationMinutes ?? 0,
    image: img,
    raw: srv
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/Service')
    const data = Array.isArray(res.data) ? res.data : [res.data]
    list.value = data.map(normalize)
  } catch (e) {
    error.value =
      e?.response?.data?.title ||
      e?.response?.data?.error ||
      e?.message ||
      'Failed to load services'
  } finally {
    loading.value = false
  }
}

function addToCart(s) {
  cart.add({ id: s.id, name: s.name, price: s.price, image: s.image }, 1)

  // toast
  lastAdded.value = s.name
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (showToast.value = false), 1500)

  // If you want to navigate immediately instead of toast:
  // router.push('/cart')
}

function goCart() {
  showToast.value = false
  router.push('/cart')
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<template>
  <div>
    <SectionHero
      title="Services 1"
      subtitle="Services"
      desc="Reliable cleaning solutions for a healthier, brighter tomorrow."
    >
      <template #actions>
        <router-link to="/checkout" class="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold">Schedule An Appointment</router-link>
      </template>
    </SectionHero>

    <section class="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
      <!-- Main grid -->
      <div class="lg:col-span-2">
        <!-- Filter -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <button
            class="px-3 py-1.5 rounded-full border"
            :class="{'bg-blue-600 text-white border-blue-600': activeCat === 'All'}"
            @click="activeCat = 'All'"
          >All</button>
          <button
            v-for="c in categories" :key="c"
            class="px-3 py-1.5 rounded-full border"
            :class="{'bg-blue-600 text-white border-blue-600': activeCat === c}"
            @click="activeCat = c"
          >{{ c }}</button>
        </div>

        <div v-if="loading" class="text-gray-600">Loading services…</div>
        <div v-else-if="error" class="text-red-600">{{ error }}</div>
        <div v-else class="grid sm:grid-cols-2 gap-6">
          <ServiceCardClinara
            v-for="s in filtered" :key="s.serviceId"
            :id="s.serviceId"
            :title="s.name"
            :desc="s.description"
            :price="Number(s.price || 0)"
            :duration="Number(s.durationMinutes || 0)"
            :imageUrl="s.imageUrl"
            :detailsTo="'/services'"
          />
        </div>
      </div>

      <!-- Sidebar -->
      <ServicesSidebar :links="sidebarLinks" />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import SectionHero from '@/components/SectionHero.vue'
import ServiceCardClinara from '@/components/ServiceCardClinara.vue'
import ServicesSidebar from '@/components/ServicesSidebar.vue'

const loading = ref(false)
const error   = ref('')
const items   = ref([])

const categories = ref([])
const activeCat  = ref('All')

const sidebarLinks = [
  { title: 'Eco-Friendly Cleaning', to: '/services' },
  { title: 'Commercial Cleaning', to: '/services' },
  { title: 'Carpet & rug cleaning', to: '/services' },
  { title: 'Warehouse Cleaning', to: '/services' },
  { title: 'Medical Facility Cleaning', to: '/services' }
]

const filtered = computed(() => {
  if (activeCat.value === 'All') return items.value
  return items.value.filter(s => (s.category || 'General') === activeCat.value)
})

async function load() {
  loading.value = true; error.value = ''
  try {
    const { data } = await api.get('/Service')
    const arr = Array.isArray(data) ? data : (data ? [data] : [])
    // Derive categories from data (fallback to 'General')
    const cats = new Set()
    arr.forEach(s => cats.add(s.category || 'General'))
    categories.value = Array.from(cats)
    items.value = arr
  } catch (e) {
    error.value = e?.response?.data?.title || e?.response?.data?.error || e?.message || 'Failed to load services'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

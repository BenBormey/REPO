<template>
  <section class="max-w-4xl mx-auto px-4 py-10">
    <h1 class="text-3xl font-bold mb-6">Place Booking</h1>

    <!-- Require login banner -->
    <div
      v-if="!auth.isAuth"
      class="mb-4 rounded-lg border bg-amber-50 text-amber-900 px-4 py-3 flex items-center justify-between"
    >
      <span>You must be signed in to place a booking.</span>
      <router-link
        class="btn btn-primary"
        :to="{ name: 'login', query: { redirect: route.fullPath } }"
      >Sign in</router-link>
    </div>

    <!-- Cart status -->
    <div
      v-if="auth.isAuth && (fromCartOne || fromCartMany)"
      class="mb-4 rounded-lg border bg-green-50 text-green-800 px-4 py-3"
    >
      <div v-if="fromCartOne">
        Using service from cart: <b>{{ cart.items[0].name }}</b> (x{{ cart.items[0].qty }})
      </div>
      <div v-else>
        Multiple services in cart ({{ cart.items.length }} items).
        This will create <b>1 booking</b> with multiple items.
      </div>
    </div>

    <!-- Loading / error -->
    <div v-if="auth.isAuth && loadingSrv" class="status">Loading services…</div>
    <div v-else-if="auth.isAuth && srvError" class="status error">{{ srvError }}</div>

    <!-- Form -->
    <form v-else-if="auth.isAuth" class="space-y-6" @submit.prevent="submit">
      <!-- Service selection -->
      <div class="card p-5">
        <label class="block mb-2 text-sm text-gray-600">Service *</label>

        <select
          v-model="f.serviceId"
          :disabled="fromCartOne || fromCartMany"
          class="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
          required
          v-if="!fromCartMany"
        >
          <option disabled value="">Select a service…</option>
          <option v-for="s in services" :key="s.serviceId" :value="String(s.serviceId)">
            {{ s.name }} — ${{ money(s.price) }}
          </option>
        </select>

        <!-- Preview -->
        <div v-if="currentPreview" class="flex gap-4 items-center mt-4">
          <img :src="thumb(currentPreview.imageUrl)" class="w-24 h-24 object-cover rounded-lg" />
          <div>
            <div class="font-semibold">{{ currentPreview.name }}</div>
            <div class="text-sm text-gray-600">
              ${{ money(currentPreview.price) }}
            </div>
            <p class="text-sm mt-1 text-gray-600 line-clamp-2">{{ currentPreview.description }}</p>
          </div>
        </div>

        <!-- Compact list when many -->
        <div v-if="fromCartMany" class="mt-3 space-y-2">
          <div v-for="it in cart.items" :key="it.id" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3">
              <img :src="thumb(it.image)" class="w-10 h-10 rounded object-cover" />
              <span>{{ it.name }} <span class="opacity-60">×{{ it.qty }}</span></span>
            </div>
            <span>${{ money(it.price * (it.qty ?? 1)) }}</span>
          </div>
        </div>
      </div>

      <!-- Contact & schedule -->
      <div class="grid sm:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm text-gray-600">Full name *</span>
          <input v-model.trim="f.fullName" :readonly="!!auth.user?.fullName"
                 class="w-full border rounded-lg px-3 py-2" required />
        </label>
        <label class="block">
          <span class="text-sm text-gray-600">Phone *</span>
          <input v-model.trim="f.phone" :readonly="!!auth.user?.phone"
                 class="w-full border rounded-lg px-3 py-2" required />
        </label>
        <label class="block">
          <span class="text-sm text-gray-600">Email</span>
          <input v-model.trim="f.email" type="email" :readonly="!!auth.user?.email"
                 class="w-full border rounded-lg px-3 py-2" />
        </label>
        <label class="block">
          <span class="text-sm text-gray-600">Address *</span>
          <input v-model.trim="f.address" :readonly="!!auth.user?.address"
                 class="w-full border rounded-lg px-3 py-2" required />
        </label>
        <label class="block">
          <span class="text-sm text-gray-600">Date *</span>
          <input v-model="f.date" type="date" :min="minDate" class="w-full border rounded-lg px-3 py-2" required />
        </label>
        <label class="block">
          <span class="text-sm text-gray-600">Time slot *</span>
          <input v-model="f.time" type="time" class="w-full border rounded-lg px-3 py-2" required />
        </label>
      </div>

      <label class="block">
        <span class="text-sm text-gray-600">Notes</span>
        <textarea v-model.trim="f.notes" rows="3" class="w-full border rounded-lg px-3 py-2"></textarea>
      </label>

      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
      <div v-if="ok" class="text-green-700 text-sm">Booking submitted! We’ll contact you soon.</div>

      <div class="flex gap-3">
        <button :disabled="loading" class="btn btn-primary">
          <span v-if="loading">Placing booking…</span>
          <span v-else>Place booking</span>
        </button>
        <router-link to="/services" class="btn btn-outline">Back to services</router-link>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()

const FILE_BASE    = import.meta.env.VITE_FILE_BASE    || 'http://localhost:5203'
const BOOKING_PATH = import.meta.env.VITE_BOOKING_PATH || '/Booking'   // axios base '/api'
const LOCATION_ID  = Number(import.meta.env.VITE_DEFAULT_LOCATION_ID || 1)

const services   = ref([])
const loadingSrv = ref(false)
const srvError   = ref('')

const f = ref({
  serviceId: '',
  fullName: '', phone: '', email: '', address: '',
  date: '', time: '', notes: ''
})

const loading = ref(false)
const ok      = ref(false)
const error   = ref('')

const fromCartOne  = computed(() => cart.items.length === 1)
const fromCartMany = computed(() => cart.items.length > 1)

const currentPreview = computed(() => {
  if (fromCartOne.value) {
    const it = cart.items[0]
    return { name: it.name, price: it.price, description: '', imageUrl: it.image }
  }
  if (f.value.serviceId) return services.value.find(s => String(s.serviceId) === String(f.value.serviceId))
  return null
})

const money = n => Number(n ?? 0).toFixed(2)
const thumb = p => !p ? 'https://placehold.co/300x200?text=No+Image' : (String(p).startsWith('http') ? p : `${FILE_BASE}${p}`)

const today = new Date()
const minDate = today.toISOString().slice(0,10)

function prefillFromToken () {
  if (auth.user?.customerId) f.value.customerId = auth.user.customerId
  if (auth.user?.fullName)   f.value.fullName   = auth.user.fullName
  if (auth.user?.phone)      f.value.phone      = auth.user.phone
  if (auth.user?.email)      f.value.email      = auth.user.email
  if (auth.user?.address)    f.value.address    = auth.user.address
}

async function loadServices() {
  loadingSrv.value = true; srvError.value = ''
  try {
    const res = await api.get('/Service')
    services.value = Array.isArray(res.data) ? res.data : [res.data]
  } catch (e) {
    srvError.value = e?.response?.data?.title || e?.response?.data?.error || e?.message || 'Failed to load services'
  } finally {
    loadingSrv.value = false
  }
}

onMounted(async () => {
  if (!auth.isAuth) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  const d = new Date(); d.setDate(d.getDate() + 1)
  f.value.date = d.toISOString().slice(0,10)
  f.value.time = '09:00'
  prefillFromToken()
  await loadServices()
  if (fromCartOne.value) f.value.serviceId = String(cart.items[0].id)
  else if (route.query.serviceId) {
    const q = String(route.query.serviceId)
    if (services.value.some(s => String(s.serviceId) === q)) f.value.serviceId = q
  }
})

watch(() => auth.token, (t) => {
  if (!t) router.replace({ name: 'login', query: { redirect: route.fullPath } })
  else prefillFromToken()
})

function validate() {
  if (!auth.isAuth) return 'Please sign in to place a booking.'
  if (fromCartMany.value && !cart.items.length) return 'Your cart is empty.'
  if (!fromCartMany.value && !f.value.serviceId) return 'Please select a service.'
  if (!f.value.fullName || !f.value.phone || !f.value.address) return 'Fill full name, phone and address.'
  if (!f.value.date || !f.value.time) return 'Pick date & time.'
  return ''
}

const formatTime = t => t ? `${String(t).padStart(5,'0')}:00` : null

function buildItems(serviceId) {
  if (fromCartMany.value) {
    return cart.items.map(it => ({
      serviceId: Number(it.id),
      quantity : Number(it.qty ?? 1),
      price    : Number(it.price ?? 0),
      remark   : ''
    }))
  } else {
    const svcId = Number(serviceId)
    const svc   = services.value.find(s => Number(s.serviceId) === svcId)
    return [{ serviceId: svcId, quantity: 1, price: Number(svc?.price ?? 0), remark: '' }]
  }
}

async function submit() {
  error.value = ''; ok.value = false
  const msg = validate()
  if (msg) { error.value = msg; return }
  loading.value = true
  try {
    const when    = `${f.value.date}T${f.value.time}:00`
    const contact = `Contact: ${f.value.fullName} | ${f.value.phone}${f.value.email ? ' | ' + f.value.email : ''}`
    const notes   = [contact, f.value.notes].filter(Boolean).join('\n')

    const payload = {
      customerId    : auth.user.customerId ?? auth.user.id,
      cleanerId     : null,
      bookingDate   : when,                    // ISO string
      timeSlot      : formatTime(f.value.time),
      locationId    : LOCATION_ID,             // use env / constant
      addressDetail : f.value.address,
      notes,
      items         : buildItems(fromCartOne.value ? cart.items[0].id : f.value.serviceId)
    }

    await api.post(BOOKING_PATH, payload)     // -> /api/Booking
    ok.value = true
    if (typeof cart.clear === 'function') cart.clear()
    setTimeout(() => router.push('/services'), 900)
  } catch (e) {
    if (e?.response?.status === 401) {
      router.replace({ name: 'login', query: { redirect: route.fullPath } })
      return
    }
    error.value = e?.response?.data?.title || e?.response?.data?.error || e?.message || 'Submit failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.status { padding: 12px; }
.status.error { color: #b91c1c; }
</style>

<template>
  <section class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">My Bookings</h1>
      <router-link v-if="!auth.isAuth" class="btn-primary" :to="{ name: 'login', query: { redirect: '/my-bookings' } }">Sign in</router-link>
    </div>

    <div v-if="!auth.isAuth" class="rounded-xl border bg-amber-50 text-amber-900 px-4 py-3">
      You must be signed in to view your bookings.
    </div>

    <div v-else class="rounded-2xl border bg-white p-4 mb-6 grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
      <label class="block">
        <span class="label">From</span>
        <input v-model="q.from" type="date" class="input" />
      </label>
      <label class="block">
        <span class="label">To</span>
        <input v-model="q.to" type="date" class="input" />
      </label>
      <div class="flex gap-2">
        <button class="btn-primary" @click="load">Search</button>
        <button class="btn-outline" @click="resetRange">Reset</button>
      </div>
      <div class="text-sm text-gray-500 sm:col-span-2 md:col-span-1">
        Showing {{ items.length }} result<span v-if="items.length !== 1">s</span>
      </div>
    </div>

    <div v-if="loading" class="grid sm:grid-cols-2 gap-3">
      <div v-for="n in 4" :key="n" class="rounded-xl border p-4 animate-pulse">
        <div class="h-5 w-40 bg-gray-200 rounded mb-2"></div>
        <div class="h-4 w-56 bg-gray-200 rounded mb-3"></div>
        <div class="h-20 w-full bg-gray-200 rounded"></div>
      </div>
    </div>
    <div v-else-if="error" class="p-4 text-rose-600">{{ error }}</div>

    <div v-else>
      <div v-if="!items.length" class="p-8 text-center rounded-2xl border bg-gray-50 text-gray-500">
        No bookings found for the selected range.
      </div>

      <ul v-else class="space-y-3">
        <li v-for="b in items" :key="b.bookingId" class="p-4 border rounded-2xl bg-white">
          <!-- Header -->
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold">
              Booking #{{ shortId(b.bookingId) }}
              <span class="ml-2 badge" :class="statusClass(b.status)">{{ prettyStatus(b.status) }}</span>
            </div>
            <div class="text-sm text-gray-500">{{ dateTimeLine(b) }}</div>
          </div>

          <!-- Meta row -->
          <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
            <div><span class="muted">Location:</span> {{ b.locationId ?? '—' }}</div>
            <div><span class="muted">Time slot:</span> {{ b.timeSlot || '—' }}</div>
            <div class="sm:col-span-2"><span class="muted">Address:</span> {{ b.addressDetail || '—' }}</div>
          </div>

          <!-- Toggle button -->
          <div class="mt-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              @click="toggle(b.bookingId)"
              :aria-expanded="isOpen(b.bookingId)"
            >
              <svg :class="['h-4 w-4 transition-transform', isOpen(b.bookingId) ? 'rotate-90' : '']" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>{{ isOpen(b.bookingId) ? 'Hide details' : 'Show details' }}</span>
            </button>
          </div>

          <!-- Details (collapsed by default) -->
          <transition name="fade">
            <div v-if="isOpen(b.bookingId)" class="mt-3 space-y-3">
              <!-- Table -->
              <div v-if="Array.isArray(b.details) && b.details.length" class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="text-left border-b">
                      <th class="py-2 pr-3">Service</th>
                      <th class="py-2 pr-3">Qty</th>
                      <th class="py-2 pr-3">Price</th>
                      <th class="py-2 pr-3">Subtotal</th>
                      <th class="py-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in b.details" :key="d.bookingDetailId" class="border-b last:border-0">
                      <td class="py-2 pr-3">
                        {{ serviceName(d.serviceId) }} <span class="opacity-60">(#{{ d.serviceId }})</span>
                      </td>
                      <td class="py-2 pr-3">{{ d.quantity ?? 0 }}</td>
                      <td class="py-2 pr-3">${{ money(d.price ?? 0) }}</td>
                      <td class="py-2 pr-3">${{ money(detailSubtotal(d)) }}</td>
                      <td class="py-2">{{ d.remark || '' }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="py-2 text-right font-semibold">Total</td>
                      <td class="py-2 font-semibold">${{ money(bookingTotal(b)) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Notes -->
              <details v-if="b.notes">
                <summary class="text-sm text-gray-600 cursor-pointer">Notes</summary>
                <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">{{ b.notes }}</pre>
              </details>
            </div>
          </transition>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()

const items = ref([])
const loading = ref(false)
const error = ref('')

const q = ref({ from: '', to: '' })

// collapsed state
const openIds = ref(new Set())
const isOpen = (id) => openIds.value.has(String(id))
const toggle = (id) => {
  const k = String(id)
  const s = new Set(openIds.value)
  if (s.has(k)) s.delete(k); else s.add(k)
  openIds.value = s
}

// service cache for names
const serviceMap = ref(new Map())

function initDefaultRange() {
  const now = new Date()
  const past = new Date(now); past.setDate(now.getDate() - 60)
  const future = new Date(now); future.setDate(now.getDate() + 60)
  q.value.from = past.toISOString().slice(0,10)
  q.value.to   = future.toISOString().slice(0,10)
}
function resetRange() { initDefaultRange(); load() }

function shortId(id) { return String(id).split('-')[0] }
function prettyStatus(s) {
  const map = { pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined', assigned: 'Assigned' }
  return map[s?.toLowerCase?.()] ?? s ?? '—'
}
function statusClass(s) {
  const k = s?.toLowerCase?.()
  if (k === 'confirmed' || k === 'assigned') return 'badge-success'
  if (k === 'declined') return 'badge-danger'
  return 'badge-warn'
}
function dateTimeLine(b) {
  const d = new Date(b.bookingDate)
  const dStr = isNaN(d) ? b.bookingDate : d.toLocaleString()
  return `${dStr} • Slot ${b.timeSlot || ''}`
}

const money = n => Number(n ?? 0).toFixed(2)
function detailSubtotal(d) {
  const raw = Number(d?.subtotal ?? 0)
  if (raw > 0) return raw
  return Number(d?.quantity ?? 0) * Number(d?.price ?? 0)
}
function bookingTotal(b) {
  if (!Array.isArray(b.details)) return 0
  return b.details.reduce((sum, d) => sum + detailSubtotal(d), 0)
}
function serviceName(serviceId) {
  const id = Number(serviceId)
  return serviceMap.value.get(id)?.name ?? 'Service'
}

async function loadServices() {
  try {
    const res = await api.get('/Service')
    const list = Array.isArray(res.data) ? res.data : [res.data]
    const m = new Map()
    for (const s of list) m.set(Number(s.serviceId), { name: s.name })
    serviceMap.value = m
  } catch {/* ignore */}
}

async function load() {
  if (!auth.isAuth || !auth.user) return
  loading.value = true; error.value = ''; items.value = []
  try {
    const id = auth.user.customerId ?? auth.user.id
    const res = await api.get(`/Booking/customer/${id}`, { params: { from: q.value.from, to: q.value.to } })
    items.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('MyBookings load error:', e?.response?.data || e)
    error.value = e?.response?.data?.title || e?.message || 'Failed to load bookings'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (auth.isAuth) {
    initDefaultRange()
    await Promise.all([loadServices(), load()])
  }
})
</script>

<style scoped>
.muted { color: #6b7280 }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; }
.badge-success { background: #dcfce7; color: #166534 }
.badge-danger  { background: #fee2e2; color: #991b1b }
.badge-warn    { background: #fef3c7; color: #92400e }
.btn-primary { padding: 8px 14px; border-radius: 10px; background: #2563eb; color: white; }
.btn-outline { padding: 8px 14px; border-radius: 10px; border: 1px solid #d1d5db; background: white; color: #111827; }
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px 12px; }
.label { font-size: 0.875rem; color: #6b7280; }

/* simple fade for expand/collapse */
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

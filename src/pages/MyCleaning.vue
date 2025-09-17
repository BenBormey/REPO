<template>
  <section class="max-w-6xl mx-auto px-4 py-10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">My Cleaning</h1>
        <p class="text-sm text-gray-500 mt-1">Jobs you can pick up and confirm</p>
      </div>
      <div v-if="auth.isAuth" class="hidden sm:flex items-center gap-3">
        <div class="text-sm text-gray-600">
          {{ auth.user?.fullName || auth.user?.email }}
        </div>
        <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-600">
          Cleaner
        </span>
      </div>
    </div>

    <!-- Guard -->
    <div
      v-if="!auth.isAuth"
      class="rounded-xl border bg-amber-50 text-amber-900 px-4 py-3 flex items-center justify-between"
    >
      <span>សូម Login ជា Cleaner មុនពេលមើល/confirm ការងារ។</span>
      <router-link class="btn-primary" :to="{ name: 'login', query: { redirect: '/my-cleaning' } }">Sign in</router-link>
    </div>

    <!-- Filters -->
    <div v-else class="rounded-2xl border bg-white p-4 mb-6">
      <div class="flex flex-wrap gap-3 items-end">
        <label class="block">
          <span class="label">From</span>
          <input v-model="q.from" type="date" class="input" />
        </label>
        <label class="block">
          <span class="label">To</span>
          <input v-model="q.to" type="date" class="input" />
        </label>

        <div class="flex items-center gap-2">
          <button
            v-for="s in statuses"
            :key="s.val"
            class="chip"
            :class="q.status===s.val ? 'chip-active' : ''"
            @click="q.status = s.val; load()"
          >
            <span class="dot" :class="s.dot"></span>{{ s.text }}
          </button>
        </div>

        <div class="ml-auto flex gap-2">
          <button class="btn-primary" @click="load">Search</button>
          <button class="btn-outline" @click="resetRange">Reset</button>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">Showing {{ items.length }} job<span v-if="items.length!==1">s</span></p>
    </div>

    <!-- States -->
    <div v-if="loading">
      <div class="grid sm:grid-cols-2 gap-3">
        <div v-for="n in 4" :key="n" class="rounded-xl border p-4 animate-pulse">
          <div class="h-5 w-40 bg-gray-200 rounded mb-2"></div>
          <div class="h-4 w-56 bg-gray-200 rounded mb-3"></div>
          <div class="h-20 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="p-4 text-rose-600">{{ error }}</div>

    <!-- List -->
    <div v-else>
      <div v-if="!items.length" class="p-8 text-center rounded-2xl border bg-gray-50 text-gray-500">
        No bookings found for the selected filters.
      </div>

      <ul v-else class="grid sm:grid-cols-2 gap-3">
        <li v-for="b in items" :key="b.bookingId" class="p-4 border rounded-2xl bg-white">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="font-semibold">
              Booking #{{ shortId(b.bookingId) }}
              <span class="ml-2 badge" :class="statusClass(b.status)">
                {{ prettyStatus(b.status) }}
              </span>
            </div>
            <div class="text-sm text-gray-500">{{ dateTimeLine(b) }}</div>
          </div>

          <div class="grid md:grid-cols-3 gap-2 mt-3 text-sm">
            <div><span class="muted">Service ID:</span> {{ b.serviceId }}</div>
            <div><span class="muted">Location:</span> {{ b.locationId }}</div>
            <div><span class="muted">Time slot:</span> {{ b.timeSlot }}</div>
            <div class="md:col-span-3"><span class="muted">Address:</span> {{ b.addressDetail }}</div>
          </div>

          <details class="mt-2">
            <summary class="text-sm text-gray-600 cursor-pointer">Notes</summary>
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">{{ b.notes }}</pre>
          </details>

          <div class="mt-3 flex flex-wrap gap-2" v-if="showAction(b)">
            <button class="btn-primary" :disabled="actingId===b.bookingId" @click="confirm(b)">
              {{ actingId===b.bookingId && actingType==='confirm' ? 'Confirming…' : 'Confirm (assign to me)' }}
            </button>
            <button class="btn-outline" :disabled="actingId===b.bookingId" @click="decline(b)">
              {{ actingId===b.bookingId && actingType==='decline' ? 'Declining…' : 'Decline' }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()

// API paths
const LIST_PATH = '/Booking/for-cleaner'
// Use functions for RESTful item routes
const CONFIRM_PATH = (id: string) => `/Booking/${id}/confirm`   // PATCH
const DECLINE_PATH = (id: string) => `/Booking/${id}/decline`   // PATCH (change if your API differs)

const items = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const q = ref({ status: 'pending', from: '', to: '' })
const statuses = [
  { val: 'pending',   text: 'Pending',   dot: 'bg-amber-500' },
  { val: 'assigned',  text: 'Assigned',  dot: 'bg-green-500' },
  { val: 'confirmed', text: 'Confirmed', dot: 'bg-emerald-600' },
  { val: 'declined',  text: 'Declined',  dot: 'bg-rose-500' },
]

const actingId   = ref<string|null>(null)
const actingType = ref<'confirm'|'decline'|''>('')

function initDefaultRange () {
  const now = new Date()
  const past = new Date(now); past.setDate(now.getDate() - 60)
  const future = new Date(now); future.setDate(now.getDate() + 60)
  q.value.from = past.toISOString().slice(0,10)
  q.value.to   = future.toISOString().slice(0,10)
}
function resetRange () { initDefaultRange(); load() }

function shortId (id: any) { return String(id).split('-')[0] }
function prettyStatus (s: any) {
  const map: Record<string,string> = { pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined', assigned: 'Assigned' }
  return map[String(s ?? '').toLowerCase()] ?? s
}
function statusClass (s: any) {
  const k = String(s ?? '').toLowerCase()
  if (k === 'confirmed' || k === 'assigned') return 'badge-success'
  if (k === 'declined') return 'badge-danger'
  return 'badge-warn'
}
function dateTimeLine (b: any) {
  const d = new Date(b.bookingDate)
  const dStr = isNaN(+d) ? b.bookingDate : d.toLocaleString()
  return `${dStr} • Slot ${b.timeSlot || ''}`
}
function myCleanerId () {
  // adjust property names to your auth payload if needed
  return auth?.user?.cleanerId || auth?.user?.id
}
function showAction (b: any) {
  const k = String(b.status ?? '').toLowerCase()
  // Cleaner can act when job is pending
  // or assigned to them (reconfirm/decline their assignment)
  return k === 'pending' || (k === 'assigned' && (!b.cleanerId || b.cleanerId === myCleanerId()))
}

async function load () {
  if (!auth.isAuth) return
  loading.value = true; error.value = ''; items.value = []
  try {
    const res = await api.get(LIST_PATH, { params: { status: q.value.status, from: q.value.from, to: q.value.to } })
    //alert(q.value.status)
    items.value = Array.isArray(res.data) ? res.data : []
  } catch (e: any) {
    console.error('Cleaner load error:', e?.response?.data || e)
    error.value = e?.response?.data?.title || e?.message || 'Failed to load bookings'
  } finally {
    loading.value = false
  }
}

async function confirm (b: any) {
  actingId.value = b.bookingId; actingType.value = 'confirm'
  try {
    // Backend expects PATCH /Booking/{id}/confirm with Bearer token only (no body)
    await api.patch(CONFIRM_PATH(b.bookingId))
    b.status = 'confirmed'
    b.cleanerId = myCleanerId()
  } catch (e: any) {
    alert(e?.response?.data?.title || e?.message || 'Confirm failed')
  } finally {
    actingId.value = null; actingType.value = ''
  }
}
async function decline (b: any) {
  actingId.value = b.bookingId; actingType.value = 'decline'
  try {
    await api.patch(DECLINE_PATH(b.bookingId))
    b.status = 'declined'
  } catch (e: any) {
    alert(e?.response?.data?.title || e?.message || 'Decline failed')
  } finally {
    actingId.value = null; actingType.value = ''
  }
}

// Auto-init after login as well
onMounted(() => { if (auth.isAuth) { initDefaultRange(); load() } })
watch(() => auth.isAuth, (ok) => { if (ok) { initDefaultRange(); load() } })
</script>

<style scoped>
.muted { color: #6b7280 }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; }
.badge-success { background: #dcfce7; color: #166534 }
.badge-danger  { background: #fee2e2; color: #991b1b }
.badge-warn    { background: #fef3c7; color: #92400e }
.btn-primary { @apply px-3 py-2 rounded-lg text-white; background: #2563eb; }
.btn-outline { @apply px-3 py-2 rounded-lg border border-gray-300; background: white; color: #111827; }
.input { @apply w-full border rounded-lg px-3 py-2; }
.label { @apply text-sm text-gray-600; }
.chip { @apply inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm; }
.chip-active { @apply bg-gray-100 border-gray-300; }
.dot { @apply inline-block w-2 h-2 rounded-full; }
</style>

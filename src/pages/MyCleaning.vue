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

    <!-- Guard (not logged in) -->
    <div
      v-if="!auth.isAuth"
      class="rounded-xl border bg-amber-50 text-amber-900 px-4 py-3 flex items-center justify-between"
    >
      <span>សូម Login ជា Cleaner មុនពេលមើល/confirm ការងារ។</span>
      <router-link class="btn-primary" :to="{ name: 'login', query: { redirect: '/my-cleaning' } }">Sign in</router-link>
    </div>

    <!-- Guard (logged in but not cleaner role) -->
    <div
      v-else-if="!isCleaner"
      class="rounded-xl border bg-amber-50 text-amber-900 px-4 py-3"
    >
      Your account is not a Cleaner. Please contact admin to grant Cleaner role.
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
            @click="() => { q.status = s.val; load() }"
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
    <div v-if="auth.isAuth && isCleaner && loading">
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
    <div v-else-if="auth.isAuth && isCleaner">
      <div v-if="!items.length" class="p-8 text-center rounded-2xl border bg-gray-50 text-gray-500">
        No bookings found for the selected filters.
      </div>

      <ul v-else class="grid sm:grid-cols-2 gap-3">
        <li v-for="b in items" :key="b.bookingId" class="p-4 border rounded-2xl bg-white">
          <!-- Header row -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="font-semibold">
              Booking #{{ shortId(b.bookingId) }}
              <span class="ml-2 badge" :class="statusClass(b.status)">
                {{ prettyStatus(b.status) }}
              </span>
            </div>
            <div class="text-sm text-gray-500">{{ dateTimeLine(b) }}</div>
          </div>

          <!-- Meta -->
          <div class="grid md:grid-cols-3 gap-2 mt-3 text-sm">
            <div><span class="muted">Location:</span> {{ b.locationId ?? '—' }}</div>
            <div><span class="muted">Time slot:</span> {{ b.timeSlot || '—' }}</div>
            <div class="md:col-span-3"><span class="muted">Address:</span> {{ b.addressDetail || '—' }}</div>
          </div>

          <!-- Toggle details -->
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

          <transition name="fade">
            <div v-if="isOpen(b.bookingId)" class="mt-3 space-y-2">
              <details v-if="b.notes">
                <summary class="text-sm text-gray-600 cursor-pointer">Notes</summary>
                <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap">{{ b.notes }}</pre>
              </details>
            </div>
          </transition>

          <!-- Actions -->
          <div class="mt-3 flex flex-wrap gap-2">
            <!-- Pending / Assigned -> Confirm / Decline -->
            <template v-if="canClaim(b)">
              <button class="btn-primary" :disabled="actingId===b.bookingId" @click="confirm(b)">
                {{ actingId===b.bookingId && actingType==='confirm' ? 'Confirming…' : 'Confirm (assign to me)' }}
              </button>
              <button class="btn-outline" :disabled="actingId===b.bookingId" @click="decline(b)">
                {{ actingId===b.bookingId && actingType==='decline' ? 'Declining…' : 'Decline' }}
              </button>
            </template>

            <!-- Confirmed -> Complete -->
            <template v-else-if="canComplete(b)">
              <button class="btn-primary" :disabled="actingId===b.bookingId" @click="complete(b)">
                {{ actingId===b.bookingId && actingType==='complete' ? 'Completing…' : 'Complete' }}
              </button>
            </template>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '../services/api'

const router = useRouter()
const auth = useAuthStore()

/** API paths */
const LIST_PATH     = '/Booking/for-cleaner'
const CONFIRM_PATH  = (id: string) => `/Booking/${id}/confirm`
const DECLINE_PATH  = (id: string) => `/Booking/${id}/decline`
const COMPLETE_PATH = (id: string) => `/Booking/${id}/complete`

/** state */
const items   = ref<any[]>([])
const loading = ref(false)
const error   = ref('')

const q = ref({ status: 'pending', from: '', to: '' })
const statuses = [
  { val: 'pending',   text: 'Pending',   dot: 'bg-amber-500' },
  { val: 'assigned',  text: 'Assigned',  dot: 'bg-green-500' },
  { val: 'Confirmed', text: 'Confirmed', dot: 'bg-emerald-600' },
  { val: 'Completed', text: 'Completed', dot: 'bg-gray-600' },
  { val: 'declined',  text: 'Declined',  dot: 'bg-rose-500' },
]

const actingId   = ref<string|null>(null)
const actingType = ref<'confirm'|'decline'|'complete'|''>('')

/** role guard */
const isCleaner = computed(() => {
  const roles: string[] = auth.user?.roles || []
  return roles.map(r => r?.toLowerCase?.()).includes('cleaner') || !!auth.user?.cleanerId
})

/** expand/collapse state */
const openIds = ref(new Set<string>())
const isOpen = (id: any) => openIds.value.has(String(id))
const toggle = (id: any) => {
  const k = String(id)
  const s = new Set(openIds.value)
  s.has(k) ? s.delete(k) : s.add(k)
  openIds.value = s
}

/** helpers */
const norm = (s: any) => String(s ?? '').trim().toLowerCase()

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
  const k = norm(s)
  const map: Record<string,string> = {
    pending: 'Pending',
    assigned: 'Assigned',
    confirmed: 'Confirmed',
    completed: 'Completed',
    declined: 'Declined'
  }
  return map[k] ?? s
}
function statusClass (s: any) {
  const k = norm(s)
  if (k === 'confirmed' || k === 'assigned') return 'badge-success'
  if (k === 'completed') return 'badge'
  if (k === 'declined') return 'badge-danger'
  return 'badge-warn'
}
function dateTimeLine (b: any) {
  const d = new Date(b.bookingDate)
  const dStr = isNaN(+d) ? b.bookingDate : d.toLocaleString()
  return `${dStr} • Slot ${b.timeSlot || ''}`
}
function myCleanerId () {
  return auth?.user?.cleanerId || auth?.user?.id
}

/** action guards */
function isMine (b: any) { return !b.cleanerId || String(b.cleanerId) === String(myCleanerId()) }
function canClaim (b: any) {
  const k = norm(b.status)
  // Show Confirm for 'pending' or 'assigned' (case-insensitive) and if it's open or already mine
  return (k === 'pending' || k === 'assigned') && isMine(b)
}
function canComplete (b: any) {
  return norm(b.status) === 'confirmed' && isMine(b)
}

/** data loaders */
async function load () {
  if (!auth.isAuth) return
  loading.value = true; error.value = ''; items.value = []
  try {
    const params = { status: q.value.status, from: q.value.from || null, to: q.value.to || null }
    const res = await api.get(LIST_PATH, { params })
    items.value = Array.isArray(res.data) ? res.data : []
  } catch (e: any) {
    if (e?.response?.status === 401) {
      router.replace({ name: 'login', query: { redirect: '/my-cleaning' } })
      return
    }
    error.value = e?.response?.data?.title || e?.message || 'Failed to load bookings'
  } finally {
    loading.value = false
  }
}

/** actions */
async function confirm (b: any) {
  actingId.value = b.bookingId; actingType.value = 'confirm'
  const snapshot = { status: b.status, cleanerId: b.cleanerId }
  try {
    b.status = 'Confirmed'       // optimistic
    b.cleanerId = myCleanerId()
    await api.patch(CONFIRM_PATH(b.bookingId))
    await load()
  } catch (e: any) {
    b.status = snapshot.status; b.cleanerId = snapshot.cleanerId
    alert(e?.response?.data?.title || e?.message || 'Confirm failed')
  } finally { actingId.value = null; actingType.value = '' }
}

async function decline (b: any) {
  actingId.value = b.bookingId; actingType.value = 'decline'
  const snapshot = { status: b.status }
  try {
    b.status = 'declined'
    await api.patch(DECLINE_PATH(b.bookingId))
    await load()
  } catch (e: any) {
    b.status = snapshot.status
    alert(e?.response?.data?.title || e?.message || 'Decline failed')
  } finally { actingId.value = null; actingType.value = '' }
}

async function complete (b: any) {
  actingId.value = b.bookingId; actingType.value = 'complete'
  const snapshot = { status: b.status }
  try {
    b.status = 'Completed'       // optimistic
    await api.patch(COMPLETE_PATH(b.bookingId))
    await load()
  } catch (e: any) {
    b.status = snapshot.status
    alert(e?.response?.data?.title || e?.message || 'Complete failed')
  } finally { actingId.value = null; actingType.value = '' }
}

/** boot */
onMounted(() => { if (auth.isAuth) { initDefaultRange(); load() } })
watch(() => auth.isAuth, (ok) => { if (ok) { initDefaultRange(); load() } })
</script>

<style scoped>
.muted { color: #6b7280 }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; }
.badge-success { background: #dcfce7; color: #166534 }
.badge-danger  { background: #fee2e2; color: #991b1b }
.badge-warn    { background: #fef3c7; color: #92400e }
.btn-primary { padding: 8px 12px; border-radius: 10px; background: #2563eb; color: white; }
.btn-outline { padding: 8px 12px; border-radius: 10px; border: 1px solid #d1d5db; background: white; color: #111827; }
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px 12px; }
.label { font-size: 0.875rem; color: #6b7280; }
.chip { display:inline-flex; align-items:center; gap:.5rem; border:1px solid #e5e7eb; border-radius:9999px; padding:.25rem .75rem; font-size:.875rem; }
.chip-active { background:#f9fafb; border-color:#d1d5db; }
.dot { display:inline-block; width:.5rem; height:.5rem; border-radius:9999px; }
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

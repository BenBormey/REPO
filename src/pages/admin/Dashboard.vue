<template>
  <!-- gradient background like the mock -->
  <main class="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-fuchsia-300 p-6">
    <!-- glass container (soft rounded outer panel) -->
    <section class="rounded-3xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-6">

      <!-- Header -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-800">Dashboard</h1>
          <p class="text-sm text-slate-600/80">Cleaning Service • Overview</p>
        </div>

        <!-- Filters / actions -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1">
            <button
              v-for="opt in ranges"
              :key="opt.value"
              class="px-3 py-1.5 rounded-xl text-sm transition ring-1"
              :class="(range===opt.value
                ? 'bg-slate-900 text-white ring-slate-900 shadow-lg shadow-slate-900/20'
                : 'bg-white/50 text-slate-700 ring-white/40 hover:bg-white/70 backdrop-blur')"
              @click="setRange(opt.value)"
            >{{ opt.label }}</button>
          </div>

          <div v-if="range==='custom'" class="flex items-center gap-2">
            <input type="date" v-model="from" class="rounded-lg ring-1 ring-white/40 bg-white/60 backdrop-blur px-2 py-1 text-sm" />
            <span class="text-slate-500/70 text-sm">→</span>
            <input type="date" v-model="to" class="rounded-lg ring-1 ring-white/40 bg-white/60 backdrop-blur px-2 py-1 text-sm" />
            <button class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-sm shadow-lg shadow-indigo-600/30" @click="loadAll">Apply</button>
          </div>

          <button class="px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur ring-1 ring-white/40 text-sm hover:shadow-md" @click="exportCsv">
            Export CSV
          </button>
          <button class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 text-sm" @click="$router.push('/admin/bookings/new')">
            New Booking
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <KpiCard title="Bookings (period)" :value="stats.totalBookings" :loading="loading" hint="All statuses" />
        <KpiCard title="Revenue (period)" :value="currency(stats.revenue)" :loading="loading" hint="Completed only" />
        <KpiCard title="Avg Order Value" :value="currency(stats.aov)" :loading="loading" hint="Revenue / Completed" />
        <KpiCard title="Pending (today)" :value="stats.pendingToday" :loading="loading" hint="Awaiting confirm">
          <template #bar>
            <ProgressBar :pct="pendingPct" color="amber" />
            <div class="mt-2 text-[11px] text-slate-600/80">vs target: {{ targetPending }} / day</div>
          </template>
        </KpiCard>
        <KpiCard title="Completion rate" :value="percent(completionRate)" :loading="loading" hint="Completed / (Completed+Cancelled)" />
      </div>

      <!-- Charts -->
      <div class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <!-- Trend (line/area) -->
        <div class="xl:col-span-2 rounded-2xl glass-card">
          <div class="p-5 flex items-center justify-between">
            <h2 class="text-sm font-medium text-slate-700/90">Bookings ({{ rangeLabel }})</h2>
            <div class="text-[11px] text-slate-600/70">Gradient SVG chart</div>
          </div>
          <div class="px-5 pb-5">
            <TrendChart :points="trend.points" :maxY="trend.maxY" :loading="loading" />
            <div class="mt-3 flex items-center gap-4 text-xs text-slate-700/90">
              <span class="inline-flex items-center gap-1">
                <i class="inline-block w-3 h-1 rounded bg-indigo-600"></i> Bookings
              </span>
            </div>
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="rounded-2xl glass-card">
          <div class="p-5 flex items-center justify-between">
            <h2 class="text-sm font-medium text-slate-700/90">Status Breakdown</h2>
            <div class="text-[11px] text-slate-600/70">{{ statusTotal }} total</div>
          </div>
          <div class="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DonutChart :series="statusSeries" :loading="loading" />
            <ul class="space-y-2 text-sm">
              <li v-for="s in statusLegend" :key="s.key" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="inline-block w-3 h-3 rounded" :style="{ background: s.color }"></span>
                  <span class="text-slate-700/90">{{ s.label }}</span>
                </div>
                <span class="font-medium text-slate-900/90">{{ s.value }}</span>
              </li>
              <li v-if="statusLegend.length===0" class="text-slate-500/70">No data</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Tables -->
      <div class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <!-- Recent bookings -->
        <div class="xl:col-span-2 rounded-2xl glass-card">
          <div class="p-5 flex items-center justify-between">
            <h2 class="text-sm font-medium text-slate-700/90">Recent Bookings</h2>
            <router-link class="text-xs text-indigo-600 hover:underline" to="/admin/bookings">View all</router-link>
          </div>
          <div class="px-5 pb-5">
            <ul class="divide-y divide-white/30">
              <li v-for="b in recent" :key="b.id" class="py-3 flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium text-slate-900/90">{{ b.customerName }}</div>
                  <div class="text-xs text-slate-600/80">{{ b.time }} • {{ b.location }}</div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ring-1" :class="badge(b.status)">{{ b.status }}</span>
              </li>
              <li v-if="!loading && recent.length===0" class="py-6 text-sm text-slate-600/80 text-center">
                No recent bookings.
              </li>
              <li v-if="loading" class="py-6 text-sm text-slate-500/70 text-center">Loading…</li>
            </ul>
          </div>
        </div>

        <!-- Report (daily totals) -->
        <div class="rounded-2xl glass-card">
          <div class="p-5 flex items-center justify-between">
            <h2 class="text-sm font-medium text-slate-700/90">Daily Report ({{ rangeLabel }})</h2>
            <button class="text-xs text-indigo-600 hover:underline" @click="exportCsv">Download CSV</button>
          </div>
          <div class="px-5 pb-5">
            <div class="rounded-xl ring-1 ring-white/30 overflow-hidden bg-white/40 backdrop-blur">
              <table class="w-full text-sm">
                <thead class="bg-white/40 text-slate-700/90">
                  <tr>
                    <th class="text-left px-3 py-2">Date</th>
                    <th class="text-right px-3 py-2">Bookings</th>
                    <th class="text-right px-3 py-2">Completed</th>
                    <th class="text-right px-3 py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in report" :key="r.date" class="border-t border-white/30">
                    <td class="px-3 py-2">{{ r.date }}</td>
                    <td class="px-3 py-2 text-right">{{ r.bookings }}</td>
                    <td class="px-3 py-2 text-right">{{ r.completed }}</td>
                    <td class="px-3 py-2 text-right">{{ currency(r.revenue) }}</td>
                  </tr>
                  <tr v-if="!loading && report.length===0">
                    <td colspan="4" class="px-3 py-6 text-center text-slate-600/80">No rows</td>
                  </tr>
                  <tr v-if="loading">
                    <td colspan="4" class="px-3 py-6 text-center text-slate-500/70">Loading…</td>
                  </tr>
                </tbody>
                <tfoot v-if="report.length" class="bg-white/40 border-t border-white/30">
                  <tr>
                    <td class="px-3 py-2 font-medium">Total</td>
                    <td class="px-3 py-2 text-right font-medium">{{ sum(report,'bookings') }}</td>
                    <td class="px-3 py-2 text-right font-medium">{{ sum(report,'completed') }}</td>
                    <td class="px-3 py-2 text-right font-medium">{{ currency(sum(report,'revenue')) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

    </section>
  </main>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api' // ✅ use your service everywhere

/* ---------- state ---------- */
const loading = ref(true)
const stats = ref({
  totalBookings: 0,
  revenue: 0,
  aov: 0,
  pendingToday: 0,
  completed: 0,
  cancelled: 0,
})
const recent = ref([])
const report = ref([]) // [{date, bookings, completed, revenue}]
const status = ref({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 })

/* ---------- filters ---------- */
const ranges = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'custom', label: 'Custom' },
]
const range = ref('7d')
const from = ref('')
const to = ref('')

const rangeLabel = computed(() => range.value !== 'custom'
  ? range.value
  : (from.value && to.value ? `${from.value} → ${to.value}` : 'custom'))

function setRange(v) {
  range.value = v
  if (v !== 'custom') { from.value = ''; to.value = ''; loadAll() }
}

/* ---------- helpers ---------- */
const targetPending = 10
const pendingPct = computed(() => {
  const n = stats.value.pendingToday || 0
  return Math.max(0, Math.min(100, Math.round((n / targetPending) * 100)))
})
const completionRate = computed(() => {
  const c = stats.value.completed || 0
  const k = stats.value.cancelled || 0
  const denom = c + k
  return denom ? c / denom : 0
})
const currency = (v) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0)
const percent = (v) => `${Math.round((v || 0) * 100)}%`
const badge = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'pending':   return 'bg-amber-100/70 text-amber-800 ring-amber-200'
    case 'confirmed': return 'bg-indigo-100/70 text-indigo-800 ring-indigo-200'
    case 'completed': return 'bg-emerald-100/70 text-emerald-800 ring-emerald-200'
    case 'cancelled': return 'bg-rose-100/70 text-rose-800 ring-rose-200'
    default:          return 'bg-slate-100/70 text-slate-700 ring-slate-200'
  }
}
const sum = (arr, key) => arr.reduce((a, b) => a + (Number(b[key]) || 0), 0)

/* ---------- endpoint-specific params (match Swagger!) ---------- */
function paramsTrend() {
  if (range.value === 'custom' && from.value && to.value) {
    return { fromDate: from.value, toDate: to.value } // /Report/booking-trend-report
  }
  return { range: range.value } // only if your API supports range
}
function paramsStatus() {
  if (range.value === 'custom' && from.value && to.value) {
    return { from: from.value, to: to.value } // /Dashboard/status
  }
  return { range: range.value }
}
function paramsOverview() {
  if (range.value === 'custom' && from.value && to.value) {
    return { from: from.value, to: to.value } // your overview uses same as status
  }
  return { range: range.value }
}

/* ---------- trend data ---------- */
const trend = ref({ points: [], maxY: 0 })

/* ---------- donut data ---------- */
const statusSeries = computed(() => ([
  { label: 'Pending',   value: status.value.pending   || 0, color: '#f59e0b' },
  { label: 'Confirmed', value: status.value.confirmed || 0, color: '#6366f1' },
  { label: 'Completed', value: status.value.completed || 0, color: '#10b981' },
  { label: 'Cancelled', value: status.value.cancelled || 0, color: '#ef4444' },
]))
const statusLegend = computed(() => statusSeries.value.filter(s => s.value > 0).map(s => ({ key: s.label, ...s })))
const statusTotal = computed(() => statusSeries.value.reduce((a, b) => a + b.value, 0))

/* ---------- data load ---------- */
async function loadAll() {
  loading.value = true
  try {
    // ✅ KPIs (use api service, no leading /api)
    const ov = await api.get('Dashboard/overview', { params: paramsOverview() })
    stats.value = {
      totalBookings: ov.data?.totalBookings ?? 0,
      revenue: ov.data?.revenue ?? 0,
      aov: ov.data?.aov ?? 0,
      pendingToday: ov.data?.pendingToday ?? 0,
      completed: ov.data?.completed ?? 0,
      cancelled: ov.data?.cancelled ?? 0,
    }

    // ✅ Trend + table
    const tr = await api.get('Report/booking-trend-report', { params: paramsTrend() })
    const raw = Array.isArray(tr.data) ? tr.data : []
    const rows = raw.map(x => ({
      date: (x.bookingDate || '').slice(0, 10),     // "YYYY-MM-DD"
      bookings: Number(x.totalBookings) || 0,
      completed: 0,
      revenue: 0
    }))
    report.value = rows
    const maxB = Math.max(1, ...rows.map(r => r.bookings))
    trend.value = {
      points: rows.map((r, i) => ({ i, bookings: r.bookings, revenueScaled: 0 })), // only bookings for now
      maxY: Math.max(maxB, Math.round(maxB * 1.2)),
    }

    // ✅ Status
    const st = await api.get('Dashboard/status', { params: paramsStatus() })
    status.value = {
      pending:   st.data?.pending   ?? 0,
      confirmed: st.data?.confirmed ?? 0,
      completed: st.data?.completed ?? 0,
      cancelled: st.data?.cancelled ?? 0,
    }

    // ✅ Recent (Swagger footer shows /api/Dashboard/recent)
    const rc = await api.get('Dashboard/recent', { params: { take: 8 } })
    recent.value = Array.isArray(rc.data) ? rc.data : []
  } catch (e) {
    console.error('[dashboard] load error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

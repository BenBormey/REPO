<template>
  <!-- gradient background like mock -->
  <main class="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-fuchsia-300 p-6">
    <!-- glass container -->
    <section class="rounded-3xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl p-6">

      <!-- Header -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-800">Dashboard</h1>
          <p class="text-sm text-slate-600/80">Cleaning Service • Overview</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1">
            <button
              v-for="opt in ranges"
              :key="opt.value"
              class="px-3 py-1.5 rounded-xl text-sm transition ring-1"
              :class="(range===opt.value
                ? 'bg-slate-900 text-white ring-slate-900 shadow-lg shadow-slate-900/20 scale-[1.02]'
                : 'bg-white/50 text-slate-700 ring-white/40 hover:bg-white/70 hover:shadow-sm backdrop-blur')"
              @click="setRange(opt.value)"
            >{{ opt.label }}</button>
          </div>

          <div v-if="range==='custom'" class="flex items-center gap-2">
            <input type="date" v-model="from" class="rounded-lg ring-1 ring-white/40 bg-white/60 backdrop-blur px-2 py-1 text-sm" />
            <span class="text-slate-500/70 text-sm">→</span>
            <input type="date" v-model="to" class="rounded-lg ring-1 ring-white/40 bg-white/60 backdrop-blur px-2 py-1 text-sm" />
            <button class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-sm shadow-lg shadow-indigo-600/30 hover:brightness-105 active:scale-95" @click="loadAll">
              Apply
            </button>
          </div>

          <button class="px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur ring-1 ring-white/40 text-sm hover:shadow-md active:scale-95" @click="exportCsv">
            Export CSV
          </button>
          <button class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 text-sm hover:brightness-105 active:scale-95" @click="$router.push('/admin/bookings/new')">
            New Booking
          </button>
        </div>
      </div>

      <!-- Top summary row -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-2">
        <!-- left: KPI gradient cards + mini bar -->
        <div class="grid grid-cols-2 gap-5">
          <KpiGradient
            icon="👥"
            title="Customers"
            :value="formatInt(stats.customers)"
            :delta="stats.customersDelta"
            from="from-emerald-400"
            to="to-emerald-600"
          />
          <KpiGradient
            icon="🧾"
            title="Orders"
            :value="formatInt(stats.orders)"
            :delta="stats.ordersDelta"
            :danger="true"
            from="from-rose-400"
            to="to-rose-600"
          />

          <GlassCard :title="`Monthly ${metricLabel}`">
            <BarChart class="h-36" :series="monthlyBars" :labels="months" />
          </GlassCard>
        </div>

        <!-- middle: target gauge -->
        <GlassCard title="Monthly Target" class="flex flex-col items-center justify-center">
          <TargetGauge :pct="targetPct" />
          <p class="text-xs text-slate-600/80 mt-2">
            You earn <b>{{ currency(stats.revenueToday) }}</b> today. Keep up the good work!
          </p>
          <div class="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <div class="text-slate-500/80">Target</div>
              <div class="font-semibold">{{ currency(targetAmount) }}</div>
            </div>
            <div>
              <div class="text-slate-500/80">Revenue</div>
              <div class="font-semibold">{{ currency(stats.revenue) }}</div>
            </div>
            <div>
              <div class="text-slate-500/80">Today</div>
              <div class="font-semibold">{{ currency(stats.revenueToday) }}</div>
            </div>
          </div>
        </GlassCard>

        <!-- right: overview KPI cards -->
        <div class="grid grid-cols-2 gap-5">
          <KpiCard title="Bookings (period)" :value="formatInt(stats.totalBookings)" :loading="loading" hint="All statuses" />
          <KpiCard title="Revenue (period)"  :value="currency(stats.revenue)"        :loading="loading" hint="Completed only" />
          <KpiCard title="Avg Order Value"   :value="currency(stats.aov)"            :loading="loading" hint="Revenue / Completed" />
          <KpiCard title="Completion rate"   :value="percent(completionRate)"        :loading="loading" hint="Completed / (Completed+Cancelled)" />
        </div>
      </div>

      <!-- Big statistics row -->
      <div class="mt-6 rounded-2xl glass-card">
        <div class="p-5 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-medium text-slate-700/90">Statistics</h2>
            <p class="text-[11px] text-slate-600/70">Target you’ve set for each month</p>
          </div>
          <div class="text-xs flex items-center gap-2">
            <button class="px-2 py-1 rounded-lg transition"
                    :class="metric==='bookings' ? 'bg-white/60 ring-1 ring-white/40' : 'bg-white/0 ring-1 ring-white/30 hover:bg-white/40'"
                    @click="metric='bookings'">Overview</button>
            <button class="px-2 py-1 rounded-lg transition"
                    :class="metric==='completed' ? 'bg-white/60 ring-1 ring-white/40' : 'bg-white/0 ring-1 ring-white/30 hover:bg-white/40'"
                    @click="metric='completed'">Sales</button>
            <button class="px-2 py-1 rounded-lg transition"
                    :class="metric==='revenue' ? 'bg-white/60 ring-1 ring-white/40' : 'bg-white/0 ring-1 ring-white/30 hover:bg-white/40'"
                    @click="metric='revenue'">Revenue</button>
            <div class="ml-2 rounded-lg bg-white/60 ring-1 ring-white/40 px-2 py-1">{{ rangeLabel }}</div>
          </div>
        </div>
        <div class="px-5 pb-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div class="xl:col-span-2">
            <TrendChart
              :key="metric + ':' + report.length"
              v-if="trend.points.length"
              :points="trend.points"
              :maxY="trend.maxY"
              :loading="loading"
            />
            <div v-else class="px-2 py-6 text-sm text-slate-500/70">No data for this range.</div>
          </div>
          <div class="space-y-3">
            <div class="rounded-xl ring-1 ring-white/30 bg-white/40 backdrop-blur p-4">
              <div class="text-xs text-slate-600/80 mb-2">Bookings by status</div>
              <div class="flex items-center gap-4">
                <DonutChart :series="statusSeries" />
                <div class="space-y-1 text-[12px]">
                  <div v-for="s in statusSeries" :key="s.label" class="flex items-center gap-2">
                    <span class="inline-block w-3 h-3 rounded" :style="{background:s.color}"></span>
                    <span class="text-slate-700/90">{{ s.label }}</span>
                    <span class="ml-auto font-medium text-slate-900/90">{{ s.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row: Top locations + Recent -->
      <div class="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <GlassCard title="Top Locations">
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="rounded-xl bg-white/40 backdrop-blur ring-1 ring-white/30 h-40 flex items-center justify-center text-slate-500/70">
              <span>Map placeholder</span>
            </div>
            <div class="space-y-3">
              <div v-for="loc in topLocations" :key="loc.name" class="flex items-center gap-3">
                <span class="text-slate-700/90 w-24 truncate">{{ loc.name }}</span>
                <div class="flex-1 h-2 rounded-full bg-white/40 overflow-hidden">
                  <div class="h-full rounded-full bg-indigo-500/70" :style="{ width: loc.pct + '%' }"></div>
                </div>
                <span class="text-slate-700/90 w-10 text-right">{{ Math.round(loc.pct) }}%</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard class="xl:col-span-2" title="Recent Bookings" action-text="See all" @action="$router.push('/admin/bookings')">
          <div class="rounded-xl ring-1 ring-white/30 overflow-hidden bg-white/40 backdrop-blur">
            <table class="w-full text-sm">
              <thead class="bg-white/40 text-slate-700/90">
                <tr>
                  <th class="text-left px-3 py-2">Customer</th>
                  <th class="text-left px-3 py-2">Category</th>
                  <th class="text-right px-3 py-2">Price</th>
                  <th class="text-right px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in recent" :key="r.id" class="border-t border-white/30 hover:bg-white/50 transition">
                  <td class="px-3 py-2">{{ r.customerName }}</td>
                  <td class="px-3 py-2">{{ r.category || 'Cleaning' }}</td>
                  <td class="px-3 py-2 text-right">{{ currency(r.price || r.amount || 0) }}</td>
                  <td class="px-3 py-2 text-right">
                    <span class="text-xs px-2 py-1 rounded-full ring-1" :class="badge(r.status)">{{ r.status }}</span>
                  </td>
                </tr>
                <tr v-if="!loading && recent.length===0">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-600/80">No recent bookings.</td>
                </tr>
                <tr v-if="loading">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500/70">Loading…</td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <!-- Daily report table -->
      <div class="mt-6 rounded-2xl glass-card">
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

    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'

/* -------------------------- local components -------------------------- */
const GlassCard = {
  props: { title: String, actionText: String },
  emits: ['action'],
  template: `
  <div class="rounded-2xl glass-card">
    <div v-if="title || $slots.header" class="p-5 flex items-center justify-between">
      <h2 class="text-sm font-medium text-slate-700/90" v-if="title">{{ title }}</h2>
      <slot name="header"></slot>
      <button v-if="actionText" class="text-xs text-indigo-600 hover:underline" @click="$emit('action')">{{ actionText }}</button>
    </div>
    <div class="px-5 pb-5">
      <slot />
    </div>
  </div>`
}

const KpiCard = {
  props: { title:String, value:[String,Number], hint:String, loading:Boolean },
  template: `
  <div class="rounded-2xl bg-white/40 backdrop-blur ring-1 ring-white/30 p-4">
    <div class="text-xs text-slate-600/80">{{ title }}</div>
    <div class="text-2xl font-semibold tracking-tight text-slate-900/90 mt-1">
      <span v-if="!loading">{{ value ?? '—' }}</span>
      <span v-else class="opacity-60">…</span>
    </div>
    <div class="text-[11px] text-slate-500/80 mt-1" v-if="hint">{{ hint }}</div>
    <slot name="bar"/>
  </div>`
}

const KpiGradient = {
  props: { icon:String, title:String, value:[String,Number], delta:Number, danger:Boolean, from:String, to:String },
  computed: {
    pillClass(){ return this.danger ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700' },
    sign(){ return (this.delta ?? 0) >= 0 ? '↑' : '↓' }
  },
  template: `
  <div class="rounded-2xl p-4 text-white shadow-md"
       :class="'bg-gradient-to-br '+(from||'from-indigo-400')+' '+(to||'to-indigo-700')">
    <div class="flex items-center justify-between">
      <span class="text-lg">{{ icon }}</span>
      <span class="text-[11px] px-2 py-1 rounded-full" :class="pillClass">
        {{ Math.abs(delta||0).toFixed(2) }}% {{ sign }}
      </span>
    </div>
    <div class="mt-2 text-xs/relaxed text-white/80">{{ title }}</div>
    <div class="text-2xl font-semibold tracking-tight">{{ value ?? '—' }}</div>
  </div>`
}

const BarChart = {
  props: { series: {type:Array, default:()=>[]}, labels: {type:Array, default:()=>[]} },
  computed:{ max(){ return Math.max(1, ...this.series.map(n=>Number(n)||0)) } },
  template: `
  <svg viewBox="0 0 300 100" preserveAspectRatio="none" class="w-full h-full">
    <g v-for="(v,i) in series" :key="i">
      <rect :x="i*(300/series.length)+4" :y="100 - (v/max*90) - 6" :width="(300/series.length)-8"
            :height="(v/max*90)" rx="5" class="fill-indigo-500/80" />
    </g>
  </svg>`
}

const TrendChart = {
  props:{ points:{type:Array,default:()=>[]}, maxY:{type:Number,default:0}, loading:Boolean },
  computed:{
    path(){
      if(!this.points.length) return ''
      const max = Math.max(1, this.maxY)
      const W=600,H=220, pad=10
      const step = (W-2*pad)/(this.points.length-1 || 1)
      const y = v => H - pad - (v/max)*(H-2*pad)
      return this.points.map((p,idx)=>`${idx?'L':'M'} ${pad+idx*step} ${y(p.value||0)}`).join(' ')
    },
    area(){
      if(!this.points.length) return ''
      const max = Math.max(1, this.maxY)
      const W=600,H=220, pad=10
      const step = (W-2*pad)/(this.points.length-1 || 1)
      const y = v => H - pad - (v/max)*(H-2*pad)
      const top = this.points.map((p,idx)=>`${idx?'L':'M'} ${pad+idx*step} ${y(p.value||0)}`).join(' ')
      const bottom = `L ${W-pad} ${H-pad} L ${pad} ${H-pad} Z`
      return top + ' ' + bottom
    }
  },
  template: `
  <div class="relative w-full">
    <svg viewBox="0 0 600 220" class="w-full h-56 rounded-xl ring-1 ring-white/30 bg-white/40 backdrop-blur">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path :d="area" fill="url(#g1)"></path>
      <path :d="path" stroke="#6366f1" stroke-width="2.5" fill="none"></path>
    </svg>
    <div v-if="loading" class="absolute inset-0 grid place-items-center text-slate-500/70 text-sm">Loading…</div>
  </div>`
}

const DonutChart = {
  props:{ series:{type:Array, default:()=>[]} },
  computed:{
    total(){ return this.series.reduce((a,b)=>a+(+b.value||0),0) || 1 },
    arcs(){
      let start=0
      return this.series.map(s=>{
        const v = (+s.value||0); const pct=v/this.total
        const end = start + pct*2*Math.PI
        const large = (end-start) > Math.PI ? 1 : 0
        const R=44,r=30,cx=50,cy=50
        const sx=cx+R*Math.cos(start), sy=cy+R*Math.sin(start)
        const ex=cx+R*Math.cos(end),   ey=cy+R*Math.sin(end)
        const sx2=cx+r*Math.cos(end),  sy2=cy+r*Math.sin(end)
        const ex2=cx+r*Math.cos(start),ey2=cy+r*Math.sin(start)
        const d=`M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} L ${sx2} ${sy2} A ${r} ${r} 0 ${large} 0 ${ex2} ${ey2} Z`
        start=end
        return { d, color:s.color||'#999', value:v, label:s.label }
      })
    }
  },
  template: `
  <div class="relative">
    <svg viewBox="0 0 100 100" class="w-40 h-40">
      <g v-for="(a,i) in arcs" :key="i">
        <path :d="a.d" :fill="a.color"></path>
      </g>
    </svg>
  </div>`
}

const TargetGauge = {
  props:{ pct:{type:Number,default:0} },
  computed:{
    arc(){
      const p = Math.max(0, Math.min(1, this.pct))
      const R=40, cx=50, cy=60, start=Math.PI, end=Math.PI*(1-p)
      const sx=cx+R*Math.cos(start), sy=cy+R*Math.sin(start)
      const ex=cx+R*Math.cos(end),   ey=cy+R*Math.sin(end)
      const large = p>0.5?1:0
      return { sx,sy,ex,ey, R, large }
    },
    text(){ return (this.pct*100).toFixed(2)+'%' }
  },
  template: `
  <div class="w-full grid place-items-center">
    <svg viewBox="0 0 100 70" class="w-52 h-36">
      <path d="M 10 60 A 40 40 0 0 1 90 60" stroke="#e5e7eb" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path :d="'M '+arc.sx+' '+arc.sy+' A '+arc.R+' '+arc.R+' 0 '+arc.large+' 0 '+arc.ex+' '+arc.ey"
            stroke="#6366f1" stroke-width="10" fill="none" stroke-linecap="round"/>
      <text x="50" y="40" text-anchor="middle" font-size="12" fill="#0f172a" font-weight="700">{{ text }}</text>
      <text x="50" y="52" text-anchor="middle" font-size="6" fill="#16a34a">+10%</text>
    </svg>
  </div>`
}
/* --------------------------------------------------------------------- */

/* ------------------------------- state -------------------------------- */
const loading = ref(true)
const stats = ref({
  customers: 3782, customersDelta: 11.01,
  orders: 5359,   ordersDelta: -9.05,
  totalBookings: 0, revenue: 0, aov: 0,
  pendingToday: 0, completed: 0, cancelled: 0,
  revenueToday: 3287
})

const recent = ref([])
const report = ref([]) // [{date, bookings, completed, revenue}]
const statusCounts = ref({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
const metric = ref('bookings') // 'bookings' | 'completed' | 'revenue'

/* ------------------------------ filters ------------------------------- */
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

/* ------------------------------ helpers ------------------------------- */
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const metricLabel = computed(() =>
  metric.value === 'bookings' ? 'Bookings'
  : metric.value === 'completed' ? 'Completed'
  : 'Revenue'
)

const monthlyBars = computed(() => {
  const key = metric.value
  const sums = new Array(12).fill(0)
  for (const r of report.value) {
    const idx = Number((r.date || '').split('-')[1] || 1) - 1
    if (idx>=0 && idx<12) sums[idx] += Number(r[key]||0)
  }
  return sums
})

const targetAmount = 20000
const targetPct = computed(() => {
  const p = (stats.value.revenue || 0) / targetAmount
  return Math.max(0, Math.min(1, p))
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
const formatInt = n => (Number(n || 0)).toLocaleString()
const badge = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'pending':   return 'bg-amber-100/70 text-amber-800 ring-amber-200'
    case 'confirmed': return 'bg-indigo-100/70 text-indigo-800 ring-indigo-200'
    case 'completed':
    case 'delivered': return 'bg-emerald-100/70 text-emerald-800 ring-emerald-200'
    case 'cancelled': return 'bg-rose-100/70 text-rose-800 ring-rose-200'
    default:          return 'bg-slate-100/70 text-slate-700 ring-slate-200'
  }
}
const sum = (arr, key) => arr.reduce((a, b) => a + (Number(b[key]) || 0), 0)

/* -------------------------- API payload normalizers ------------------- */
function pickNum(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v)
  }
  return 0
}
function normalizeOverview(raw) {
  return {
    customers:      pickNum(raw, 'customers', 'customerCount'),
    customersDelta: pickNum(raw, 'customersDelta', 'customerDelta'),
    orders:         pickNum(raw, 'orders', 'orderCount'),
    ordersDelta:    pickNum(raw, 'ordersDelta', 'orderDelta'),
    totalBookings:  pickNum(raw, 'totalBookings', 'bookings', 'total'),
    revenue:        pickNum(raw, 'revenue', 'totalRevenue', 'amount'),
    aov:            pickNum(raw, 'aov', 'avgOrderValue', 'averageOrderValue'),
    pendingToday:   pickNum(raw, 'pendingToday', 'pending'),
    completed:      pickNum(raw, 'completed', 'complete', 'done'),
    cancelled:      pickNum(raw, 'cancelled', 'canceled'),
    revenueToday:   pickNum(raw, 'revenueToday', 'todayRevenue', 'todayAmount'),
  }
}
function normalizeStatus(raw) {
  return {
    pending:   pickNum(raw, 'pending', 'Pending'),
    confirmed: pickNum(raw, 'confirmed', 'Confirmed'),
    completed: pickNum(raw, 'completed', 'Completed', 'done'),
    cancelled: pickNum(raw, 'cancelled', 'Canceled', 'Cancelled'),
  }
}

/* ------------------------------ charts data --------------------------- */
const trend = ref({ points: [], maxY: 0 })

function computeTrend() {
  const key = metric.value
  const vals = report.value.map(r => Number(r[key]) || 0)
  const maxB = Math.max(1, ...vals)
  trend.value = {
    points: report.value.map((r, i) => ({ i, value: vals[i] })),
    maxY: Math.round(maxB * 1.2),
  }
}
watch([report, metric], computeTrend, { immediate: true })

/* ------------------------------- loaders ------------------------------ */
async function loadAll() {
  loading.value = true
  try {
    // Overview
    const ov = await api.get('Report/overview', { params: paramsOverview() }).catch(()=>({ data:null }))
    if (ov?.data) stats.value = { ...stats.value, ...normalizeOverview(ov.data) }

    // Trend (daily table)
    const tr = await api.get('Report/booking-trend-report', { params: paramsTrend() }).catch(()=>({ data:[] }))
    const raw = Array.isArray(tr.data) ? tr.data : []
    const rows = raw.map(x => ({
      date: (x.bookingDate || '').slice(0, 10),
      bookings: Number(x.totalBookings) || 0,
      completed: Number(x.completed) || 0,
      revenue: Number(x.revenue) || 0
    }))
    report.value = rows.length ? rows : months.map((m,i)=>({
      date: `2025-${String(i+1).padStart(2,'0')}-01`,
      bookings:[120,360,230,310,180,150,170,90,120,380,110,90][i],
      completed:[80,300,200,260,150,120,140,70,90,330,90,70][i],
      revenue:  [2,4,3,5,2,2,2,1,2,6,1,1].map(v=>v*1000)[i]
    }))
    computeTrend()

    // Status donut
    const st = await api.get('Dashboard/status', { params: paramsStatus() }).catch(()=>({ data:null }))
    statusCounts.value = st?.data ? normalizeStatus(st.data)
                                  : { pending: 12, confirmed: 18, completed: 45, cancelled: 6 }

    // Recent
    const rc = await api.get('Report/recent', { params: { take: 8 } }).catch(()=>({ data:[] }))
    recent.value = (Array.isArray(rc.data) ? rc.data : []).map(x => ({
      id: x.id,
      customerName: x.customerName || x.customer || '—',
      category: x.category || 'Cleaning',
      price: Number(x.price ?? x.amount ?? 0),
      status: x.status || 'Pending',
      createdAt: x.createdAt || x.created_at || null,
    }))
  } finally {
    loading.value = false
  }
}

/* ------------------------ endpoint-specific params -------------------- */
function paramsTrend() {
  if (range.value === 'custom' && from.value && to.value) {
    return { fromDate: from.value, toDate: to.value }
  }
  return { range: range.value }
}
function paramsStatus() {
  if (range.value === 'custom' && from.value && to.value) {
    return { from: from.value, to: to.value }
  }
  return { range: range.value }
}
function paramsOverview() {
  if (range.value === 'custom' && from.value && to.value) {
    return { from: from.value, to: to.value }
  }
  return { range: range.value }
}

function exportCsv() {
  const key = metric.value
  const header = [`Date,${key === 'bookings' ? 'Bookings' : key === 'completed' ? 'Completed' : 'Revenue'}`]
  const rows = report.value.map(r => [r.date, r[key]].join(','))
  const csv = [header, ...rows].join('\\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `daily_${key}.csv`; a.click()
  URL.revokeObjectURL(url)
}

onMounted(loadAll)
</script>

<style scoped>
/* shared glass card */
.glass-card { @apply bg-white/40 backdrop-blur ring-1 ring-white/30; border-radius: 1rem; }
</style>

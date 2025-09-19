<template>
  <section class="max-w-6xl mx-auto px-4 py-10">
    <!-- Header -->
    <header class="mb-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-fuchsia-500/10 p-5 ring-1 ring-black/5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">My Bookings</h1>
          <p class="text-sm text-slate-500">View, pay and track your cleaning bookings</p>
        </div>
        <router-link
          v-if="!auth.isAuth"
          class="btn-primary"
          :to="{ name:'login', query:{ redirect:'/my-bookings' } }"
        >Sign in</router-link>
      </div>
    </header>

    <!-- Guard -->
    <div v-if="!auth.isAuth" class="notice-warn">
      You must be signed in to view your bookings.
    </div>

    <!-- Filters / Tabs -->
    <div v-else class="card mb-6 grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
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
        <button class="btn-ghost" @click="resetRange">Reset</button>
      </div>
      <div class="text-sm text-slate-500 sm:col-span-2 md:col-span-1">
        Showing <b>{{ displayItems.length }}</b> result<span v-if="displayItems.length !== 1">s</span>
      </div>

      <!-- Tabs -->
      <div class="col-span-full mt-2 flex items-center gap-2">
        <button class="tab" :class="tab==='active' ? 'tab-active' : ''" @click="setTab('active')">
          Active ({{ activeCount }})
        </button>
        <button class="tab" :class="tab==='history' ? 'tab-active' : ''" @click="setTab('history')">
          History ({{ historyCount }})
        </button>

        <!-- History sub-filter -->
        <label v-if="tab==='history'" class="ml-auto inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="paidOnly" />
          Paid only
        </label>
      </div>
    </div>

    <!-- States -->
    <div v-if="loading" class="grid sm:grid-cols-2 gap-3">
      <div v-for="n in 4" :key="n" class="skeleton-card"></div>
    </div>
    <div v-else-if="error" class="notice-error">{{ error }}</div>

    <!-- List -->
    <div v-else>
      <div v-if="!displayItems.length" class="notice-empty">
        No bookings found for the selected filters.
      </div>

      <ul v-else class="space-y-3">
        <li v-for="b in displayItems" :key="b.bookingId" class="card hover:shadow-lg transition-shadow">
          <!-- Header -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="font-semibold flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10">🧼</span>
              <span>Booking #{{ shortId(b.bookingId) }}</span>
              <span class="badge" :class="statusClass(b.status)">{{ prettyStatus(b.status) }}</span>
              <span class="badge" :class="paymentClass(b.paymentStatus)">{{ canonPayment(b.paymentStatus) }}</span>
            </div>
            <div class="text-sm text-slate-500">{{ dateTimeLine(b) }}</div>
          </div>

          <!-- Meta + Amount -->
          <div class="mt-3 grid gap-3 md:grid-cols-3 text-sm">
            <div><span class="muted">Location:</span> {{ b.locationId ?? '—' }}</div>
            <div><span class="muted">Time slot:</span> {{ b.timeSlot || '—' }}</div>
            <div class="md:text-right">
              <span class="muted">Total:</span>
              <span class="font-semibold">${{ money(bookingTotal(b)) }}</span>
            </div>
            <div class="md:col-span-3"><span class="muted">Address:</span> {{ b.addressDetail || '—' }}</div>
          </div>

          <!-- Actions -->
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button v-if="canPay(b)" class="btn-primary" @click="openPay(b)">Pay now</button>

            <a
              v-if="b.invoiceUrl && canonPayment(b.paymentStatus)==='Paid'"
              class="btn-outline"
              :href="b.invoiceUrl"
              target="_blank" rel="noopener"
            >Download invoice</a>

            <button type="button" class="btn-ghost ml-auto" @click="toggle(b.bookingId)" :aria-expanded="isOpen(b.bookingId)">
              <svg :class="['h-4 w-4 mr-1 transition-transform', isOpen(b.bookingId) ? 'rotate-90' : '']" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>{{ isOpen(b.bookingId) ? 'Hide details' : 'Show details' }}</span>
            </button>
          </div>

          <!-- Details -->
          <transition name="fade">
            <div v-if="isOpen(b.bookingId)" class="mt-4 space-y-4">
              <!-- Items table -->
              <div v-if="Array.isArray(b.details) && b.details.length" class="overflow-x-auto rounded-xl ring-1 ring-black/5">
                <table class="min-w-full text-sm">
                  <thead class="bg-slate-50/50">
                    <tr class="text-left">
                      <th class="py-2 px-3">Service</th>
                      <th class="py-2 px-3">Qty</th>
                      <th class="py-2 px-3">Price</th>
                      <th class="py-2 px-3">Subtotal</th>
                      <th class="py-2 px-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in b.details" :key="d.bookingDetailId" class="border-t">
                      <td class="py-2 px-3">{{ serviceName(d.serviceId) }} <span class="opacity-60">(#{{ d.serviceId }})</span></td>
                      <td class="py-2 px-3">{{ d.quantity ?? 0 }}</td>
                      <td class="py-2 px-3">${{ money(d.price ?? 0) }}</td>
                      <td class="py-2 px-3">${{ money(detailSubtotal(d)) }}</td>
                      <td class="py-2 px-3">{{ d.remark || '' }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-50/50">
                    <tr class="border-t">
                      <td colspan="3" class="py-2 px-3 text-right font-semibold">Total</td>
                      <td class="py-2 px-3 font-semibold">${{ money(bookingTotal(b)) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Payments history -->
              <div class="rounded-xl bg-slate-50/50 p-3" v-if="payments.get(b.bookingId)?.length">
                <div class="text-sm font-semibold mb-1">Payments</div>
                <div class="text-xs text-slate-600 mb-2">Records for this booking</div>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr class="text-left">
                        <th class="py-2 px-3">Date</th>
                        <th class="py-2 px-3">Method</th>
                        <th class="py-2 px-3">Status</th>
                        <th class="py-2 px-3">Amount</th>
                        <th class="py-2 px-3">Txn ID</th>
                        <th class="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="p in payments.get(b.bookingId)" :key="p.paymentId" class="border-t">
                        <td class="py-2 px-3">{{ new Date(p.paidAt ?? p.createdAt).toLocaleString() }}</td>
                        <td class="py-2 px-3">{{ p.method }}</td>
                        <td class="py-2 px-3"><span class="badge" :class="paymentClass(p.paymentStatus)">{{ canonPayment(p.paymentStatus) }}</span></td>
                        <td class="py-2 px-3">${{ money(p.amount) }} {{ p.currency || 'USD' }}</td>
                        <td class="py-2 px-3 text-xs">{{ p.transactionId || '—' }}</td>
                        <td class="py-2 px-3 text-right">
                          <button class="btn-ghost" @click="removePayment(p.paymentId, b.bookingId)">Delete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <details v-if="b.notes" class="rounded-xl bg-slate-50/50 p-3">
                <summary class="text-sm text-slate-600 cursor-pointer">Notes</summary>
                <pre class="text-xs text-slate-700 whitespace-pre-wrap mt-2">{{ b.notes }}</pre>
              </details>
            </div>
          </transition>
        </li>
      </ul>
    </div>

    <!-- Pay choice modal -->
    <div v-if="payState.open" class="fixed inset-0 z-50">
      <div class="modal-backdrop" @click="closePay"></div>
      <div class="modal-card">
        <h3 class="text-lg font-semibold">Pay booking #{{ shortId(payState.booking?.bookingId) }}</h3>
        <p class="text-sm text-slate-500 mb-3">Choose how you’d like to pay.</p>

        <!-- Amount -->
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Amount</label>
          <div class="flex gap-2">
            <button class="chip" :class="payState.mode==='full' ? 'chip-active' : ''" @click="payState.mode='full'">
              Full ({{ money(remainingAmount(payState.booking)) }})
            </button>
            <button class="chip" :class="payState.mode==='deposit' ? 'chip-active' : ''" @click="payState.mode='deposit'">Deposit</button>
          </div>
          <div v-if="payState.mode==='deposit'" class="mt-2 flex items-center gap-2">
            <span class="text-sm text-slate-600">Percent</span>
            <button class="pill" :class="payState.depositPercent===20?'pill-active':''" @click="payState.depositPercent=20">20%</button>
            <button class="pill" :class="payState.depositPercent===30?'pill-active':''" @click="payState.depositPercent=30">30%</button>
            <div class="flex items-center gap-2">
              <input type="number" min="1" max="90" v-model.number="payState.depositPercent" class="input w-20" />
              <span class="text-sm text-slate-500">%</span>
            </div>
          </div>
        </div>

        <!-- Method -->
        <div class="mb-3">
          <label class="block text-sm font-medium mb-1">Method</label>
          <div class="flex flex-wrap gap-2">
            <button class="pill" :class="payState.method==='ABA' ? 'pill-active' : ''" @click="payState.method='ABA'">ABA QR</button>
            <button class="pill" :class="payState.method==='CARD' ? 'pill-active' : ''" @click="payState.method='CARD'">Card (Visa/Master)</button>
            <button class="pill" :class="payState.method==='CASH' ? 'pill-active' : ''" @click="payState.method='CASH'">Cash (on-site)</button>
          </div>
        </div>

        <!-- Summary -->
        <div class="rounded-xl bg-slate-50 p-3 text-sm mb-3">
          <div class="flex justify-between"><span>Total</span><b>${{ money(bookingTotal(payState.booking)) }}</b></div>
          <div class="flex justify-between"><span>Already paid</span><b>${{ money(payState.booking?.paidAmount ?? 0) }}</b></div>
          <div class="flex justify-between"><span>Remaining</span><b>${{ money(remainingAmount(payState.booking)) }}</b></div>
          <div class="flex justify-between text-indigo-700 mt-1"><span>To pay now</span><b>${{ money(toPayNow) }}</b></div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button class="btn-ghost" @click="closePay">Cancel</button>
          <button class="btn-primary" :disabled="payState.loading" @click="confirmPay">
            {{ payState.loading ? 'Starting…' : 'Continue' }}
          </button>
        </div>
      </div>
    </div>

    <!-- DEV QR Modal (mock ABA) -->
    <div v-if="qr.open" class="fixed inset-0 z-50">
      <div class="modal-backdrop" @click="closeQR"></div>
      <div class="modal-card qr-card">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold">Scan to pay (DEV)</h3>
          <span class="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Mock QR</span>
        </div>
        <p class="text-sm text-slate-500 mb-3">Use ABA app to scan (demo only, not a real payment).</p>

        <div class="flex flex-col items-center gap-3">
          <img :src="qr.dataUrl" alt="QR" class="rounded-xl border" style="width:240px;height:240px;image-rendering:pixelated;" />
          <div class="rounded-lg bg-slate-50 p-2 text-xs w-full">
            <div class="flex justify-between"><span>Booking</span><b>#{{ shortId(payState.booking?.bookingId) }}</b></div>
            <div class="flex justify-between"><span>Amount</span><b>${{ money(qr.amount) }} {{ qr.currency }}</b></div>
            <div class="flex justify-between"><span>Expires</span><b>{{ qrSeconds }}s</b></div>
          </div>

          <div class="w-full text-xs break-all text-slate-500">
            <span class="font-semibold">Payload:</span> {{ qr.payload }}
          </div>

          <div class="flex gap-2 w-full">
            <button class="btn-outline flex-1" @click="refreshQR">Refresh QR</button>
            <button class="btn-outline flex-1" @click="copyPayload">Copy code</button>
            <button class="btn-primary flex-1" @click="simulatePaid">Simulate success</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// npm i qrcode
import QRCode from 'qrcode'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const items = ref([]); const loading = ref(false); const error = ref('')
const q = ref({ from: '', to: '' })

// endpoints (axios baseURL should already include /api)
const PAYMENT_CREATE = '/Payment'
const PAYMENT_BY_BOOKING = (bid) => `/Payment/booking/${bid}`
const PAYMENT_DELETE = (pid) => `/Payment/${pid}`

// dev QR mock toggle
const PAY_DEV = (import.meta?.env?.MODE ?? 'development') !== 'production'

// collapse state
const openIds = ref(new Set())
const isOpen = (id) => openIds.value.has(String(id))
const toggle = async (id) => {
  const k = String(id)
  const s = new Set(openIds.value)
  if (s.has(k)) s.delete(k)
  else { s.add(k); await loadPayments(k).catch(() => {}) }
  openIds.value = s
}

// services + payments caches
const serviceMap = ref(new Map())
const payments = ref(new Map()) // Map<bookingId, Payment[]>

// tabs
const tab = ref(route.query.tab === 'history' ? 'history' : 'active')
const paidOnly = ref(false)
function setTab(v){ tab.value=v; router.replace({ query:{ ...route.query, tab:v } }) }
function isActiveBooking(b){ const s=String(b?.status??'').toLowerCase(); return s==='pending'||s==='assigned'||s==='confirmed' }
function isHistoryBooking(b){ return !isActiveBooking(b) }
const activeCount  = computed(()=> items.value.filter(isActiveBooking).length)
const historyCount = computed(()=> items.value.filter(isHistoryBooking).length)
const displayItems = computed(()=>{
  let arr = items.value.slice()
  arr = tab.value==='active' ? arr.filter(isActiveBooking) : arr.filter(isHistoryBooking)
  if(tab.value==='history' && paidOnly.value){ arr = arr.filter(b => canonPayment(b.paymentStatus)==='Paid') }
  return arr
})

// date range helpers
function initDefaultRange(){
  const now=new Date(); const past=new Date(now); past.setDate(now.getDate()-60)
  const future=new Date(now); future.setDate(now.getDate()+60)
  q.value.from=past.toISOString().slice(0,10); q.value.to=future.toISOString().slice(0,10)
}
function resetRange(){ initDefaultRange(); load() }

// display helpers
function shortId(id){ return String(id).split('-')[0] }
function prettyStatus(s){ const map={pending:'Pending',confirmed:'Confirmed',declined:'Declined',assigned:'Assigned',completed:'Completed'}; return map[s?.toLowerCase?.()] ?? s ?? '—' }
function statusClass(s){ const k=s?.toLowerCase?.(); if(k==='confirmed'||k==='assigned')return'badge-success'; if(k==='completed')return'badge-neutral'; if(k==='declined')return'badge-danger'; return'badge-warn' }
function dateTimeLine(b){ const d=new Date(b.bookingDate); const dStr=isNaN(d)?b.bookingDate:d.toLocaleString(); return `${dStr} • Slot ${b.timeSlot||''}` }

const money = n => Number(n ?? 0).toFixed(2)
function detailSubtotal(d){ const raw=Number(d?.subtotal ?? 0); if(raw>0) return raw; return Number(d?.quantity ?? 0)*Number(d?.price ?? 0) }
function bookingTotal(b){ const fromDetails=Array.isArray(b?.details)?b.details.reduce((s,d)=>s+detailSubtotal(d),0):0; return Number(b?.amount ?? fromDetails ?? 0) }
function serviceName(id){ const k=Number(id); return serviceMap.value.get(k)?.name ?? 'Service' }

// payment status helpers
function canonPayment(s){ const k=String(s ?? '').trim().toLowerCase(); if(k.startsWith('paid'))return'Paid'; if(k.startsWith('part'))return'Partial'; if(k.startsWith('pend'))return'Pending'; return'Unpaid' }
function paymentClass(s){ const k=canonPayment(s); if(k==='Paid')return'badge-success'; if(k==='Partial')return'badge-warn'; if(k==='Pending')return'badge-neutral'; return'badge-danger' }
function remainingAmount(b){ const total=bookingTotal(b); const paid=Number(b?.paidAmount ?? 0); const left=total-paid; return left>0?left:0 }
function canPay(b){ const st=String(b?.status ?? '').toLowerCase(); const left=remainingAmount(b); return (st==='confirmed'||st==='completed') && left>0 }

// merge payments into cards
function calcStatusFromPayments (b, list) {
  const total = bookingTotal(b)
  const paid = (list || [])
    .filter(p => ['Paid','Partial'].includes(canonPayment(p.paymentStatus)))
    .reduce((s, p) => s + Number(p.amount || 0), 0)
  b.paidAmount = paid
  b.paymentStatus = (paid + 0.005 >= total) ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid')
}
async function loadPaymentsAndMerge(bookings) {
  await Promise.all((bookings || []).map(async (b) => {
    const res = await api.get(PAYMENT_BY_BOOKING(b.bookingId))
    const list = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
    const m = new Map(payments.value); m.set(b.bookingId, list); payments.value = m
    calcStatusFromPayments(b, list)
  }))
}
async function loadPayments(bookingId){
  const res = await api.get(PAYMENT_BY_BOOKING(bookingId))
  const list = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
  const m = new Map(payments.value); m.set(bookingId, list); payments.value = m
  const found = items.value.find(x => String(x.bookingId) === String(bookingId))
  if (found) calcStatusFromPayments(found, list)
}

// create/delete payment
async function createPaymentRecord({ bookingId, amount, method, status, txn, paidAt }){
  const payload = { bookingId, amount, method, paymentstatus: status, transactionid: txn || null, paidAt: paidAt || new Date().toISOString() }
  await api.post(PAYMENT_CREATE, payload)
  await loadPayments(bookingId) // update one booking instantly
}
async function removePayment(paymentId, bookingId){
  if(!confirm('Delete this payment record?')) return
  await api.delete(PAYMENT_DELETE(paymentId))
  await loadPayments(bookingId)
}

// pay chooser modal
const payState = reactive({ open:false, booking:null, mode:'full', depositPercent:30, method:'ABA', loading:false })
function openPay(b){ payState.booking=b; payState.open=true; payState.mode='full'; payState.depositPercent=30; payState.method='ABA' }
function closePay(){ payState.open=false; payState.booking=null; payState.loading=false }
const toPayNow = computed(()=>{ const b=payState.booking; if(!b) return 0; const remaining=remainingAmount(b); if(payState.mode==='full') return remaining; const pct=Math.min(90,Math.max(1,Number(payState.depositPercent||30))); return +(remaining*(pct/100)).toFixed(2) })

// DEV QR modal
const qr = reactive({ open:false, dataUrl:'', payload:'', amount:0, currency:'USD', expiresAt:0 })
const qrSeconds = computed(()=> Math.max(0, Math.ceil((qr.expiresAt - Date.now())/1000)) )
async function buildQR(payload){ qr.payload=payload; qr.dataUrl=await QRCode.toDataURL(payload,{width:240,margin:1}); qr.expiresAt=Date.now()+5*60*1000 }
async function openQR({bookingId, amount, currency}){ qr.amount=amount; qr.currency=currency||'USD'; const code=`ABA|BOOKING:${bookingId}|AMOUNT:${amount}|CUR:${qr.currency}|TS:${Date.now()}|DEV:true`; await buildQR(code); qr.open=true }
function closeQR(){ qr.open=false }
async function refreshQR(){ await buildQR(qr.payload.split('|TS:')[0]+`|TS:${Date.now()}|DEV:true`) }
async function copyPayload(){ try{ await navigator.clipboard.writeText(qr.payload); alert('Copied!') }catch{ alert('Copy failed') } }

// confirm pay
async function confirmPay(){
  if(!payState.booking) return
  try{
    payState.loading = true
    const amount = toPayNow.value
    const bookingId = payState.booking.bookingId
    const isDeposit = payState.mode === 'deposit'

    if(payState.method==='CASH'){
      await createPaymentRecord({ bookingId, amount, method:'CASH', status:'Pending', txn:`CASH-${Date.now()}` })
      closePay(); return
    }

    if(PAY_DEV && payState.method==='ABA'){
      await openQR({ bookingId: shortId(bookingId), amount, currency: 'USD' })
      payState.loading = false; return
    }
    if(PAY_DEV && payState.method==='CARD'){
      await createPaymentRecord({ bookingId, amount, method:'CARD', status: isDeposit ? 'Partial' : 'Paid', txn:`DEV-CARD-${Date.now()}` })
      closePay(); return
    }

    // production: create pending (actual capture via gateway/webhook)
    await createPaymentRecord({ bookingId, amount, method: payState.method, status:'Pending', txn:`INIT-${payState.method}-${Date.now()}` })
    closePay()
  }catch(e){
    alert(e?.response?.data?.title || e?.message || 'Payment start failed')
  }finally{
    payState.loading = false
  }
}

// DEV simulate paid from QR
async function simulatePaid(){
  try{
    const b = payState.booking
    const amount = qr.amount
    const isDeposit = payState.mode === 'deposit'
    await createPaymentRecord({
      bookingId: b.bookingId,
      amount,
      method: 'ABA',
      status: isDeposit ? 'Partial' : 'Paid',
      txn: `DEV-ABA-${Date.now()}`
    })
    closeQR(); closePay()
  }catch(e){
    alert(e?.response?.data?.title || e?.message || 'Simulate failed')
  }
}

// loaders
async function loadServices(){ try{ const res=await api.get('/Service'); const list=Array.isArray(res.data)?res.data:[res.data]; const m=new Map(); for(const s of list) m.set(Number(s.serviceId),{name:s.name}); serviceMap.value=m }catch{} }
async function load(){
  if(!auth.isAuth || !auth.user) return
  loading.value=true; error.value=''; items.value=[]
  try{
    const id = auth.user.customerId ?? auth.user.id
    const res = await api.get(`/Booking/customer/${id}`, { params:{ from:q.value.from, to:q.value.to } })
    items.value = Array.isArray(res.data) ? res.data : []
    await loadPaymentsAndMerge(items.value) // update badges immediately
  }catch(e){
    error.value = e?.response?.data?.title || e?.message || 'Failed to load bookings'
  }finally{ loading.value=false }
}

onMounted(async ()=>{ if(auth.isAuth){ initDefaultRange(); await Promise.all([loadServices(), load()]) } })
</script>

<style scoped>
/* atoms */
.muted { color:#6b7280 }
.badge{ font-size:11px; padding:2px 10px; border-radius:9999px; line-height:1.5; display:inline-flex; align-items:center; gap:.35rem; border:1px solid rgba(0,0,0,.06); background:#f8fafc }
.badge-success{ background:#dcfce7; color:#166534; border-color:#bbf7d0 }
.badge-danger{ background:#fee2e2; color:#991b1b; border-color:#fecaca }
.badge-warn{ background:#fef3c7; color:#92400e; border-color:#fde68a }
.badge-neutral{ background:#e5e7eb; color:#111827; border-color:#d1d5db }

.btn-primary{ padding:9px 14px; border-radius:12px; background:linear-gradient(180deg,#2563eb,#1e40af); color:#fff; box-shadow:0 6px 16px rgba(37,99,235,.25); transition:transform .06s ease }
.btn-primary:active{ transform:translateY(1px) }
.btn-outline{ padding:9px 14px; border-radius:12px; border:1px solid #d1d5db; background:#fff; color:#111827 }
.btn-ghost{ padding:8px 12px; border-radius:10px; border:1px dashed #d1d5db; background:transparent; color:#374151 }

.input{ width:100%; border:1px solid #e5e7eb; border-radius:12px; padding:10px 12px; background:#fff; transition:box-shadow .15s ease, border-color .15s ease }
.input:focus{ outline:none; border-color:#93c5fd; box-shadow:0 0 0 4px rgba(59,130,246,.15) }
.label{ font-size:.875rem; color:#6b7280; display:block; margin-bottom:.25rem }

/* cards / notices */
.card{ border-radius:20px; background:#fff; padding:16px; border:1px solid rgba(0,0,0,.06); box-shadow:0 4px 14px rgba(0,0,0,.03) }
.notice-warn{ border-radius:16px; border:1px solid #facc15; background:#fefce8; color:#713f12; padding:12px 16px }
.notice-error{ border-radius:16px; border:1px solid #fecaca; background:#fff1f2; color:#9f1239; padding:12px 16px }
.notice-empty{ border-radius:20px; border:1px dashed #d1d5db; background:#f8fafc; color:#64748b; padding:28px; text-align:center }

/* skeleton */
.skeleton-card{ height:120px; border-radius:20px; border:1px solid rgba(0,0,0,.06); background:linear-gradient(90deg,#f3f4f6 25%,#eef2ff 37%,#f3f4f6 63%); background-size:400% 100%; animation:shimmer 1.2s infinite }
@keyframes shimmer{ 0%{background-position:100% 0} 100%{background-position:-100% 0} }

/* modal */
.modal-backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.45) }
.modal-card{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:min(92vw,480px); border-radius:16px; background:#fff; padding:16px; box-shadow: 0 20px 70px rgba(0,0,0,.25); border:1px solid rgba(0,0,0,.06) }
.qr-card{ width:min(92vw,520px) }

/* animations */
.fade-enter-active,.fade-leave-active{ transition:opacity .18s ease }
.fade-enter-from,.fade-leave-to{ opacity:0 }

/* pills, chips, tabs */
.pill{ padding:6px 10px; border-radius:9999px; border:1px solid #e5e7eb; background:#fff; font-size:.875rem }
.pill-active{ background:#eef2ff; border-color:#c7d2fe; color:#3730a3 }
.chip{ display:inline-flex; align-items:center; gap:.35rem; border:1px solid #e5e7eb; border-radius:9999px; padding:.25rem .75rem; font-size:.875rem }
.chip-active{ background:#f8fafc; border-color:#d1d5db }

.tab{ padding:6px 10px; border-radius:9999px; border:1px solid #e5e7eb; background:#fff; font-size:.875rem }
.tab-active{ background:#eef2ff; border-color:#c7d2fe; color:#3730a3 }
</style>

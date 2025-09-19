<template>
  <main class="p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Services</h1>
        <p class="text-slate-600/80 text-sm">Manage service items</p>
      </div>
      <button
        class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90"
        @click="openCreate"
      >Add Service</button>
    </div>

    <!-- Table -->
    <div class="rounded-2xl bg-white shadow ring-1 ring-black/5 overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-4 py-2 text-left">#</th>
            <th class="px-4 py-2 text-left">Name</th>
            <th class="px-4 py-2 text-left">Price</th>
            <th class="px-4 py-2 text-left">Active</th>
            <th class="px-4 py-2 text-left">Image</th>
            <th class="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in rows" :key="s.serviceId || s.name" class="border-t">
            <td class="px-4 py-2">{{ i + 1 }}</td>
            <td class="px-4 py-2">{{ s.name }}</td>
            <td class="px-4 py-2">{{ formatMoney(s.price) }}</td>
            <td class="px-4 py-2">
              <span
                class="px-2 py-0.5 rounded text-xs"
                :class="s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ s.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-2">
              <img
                v-if="s.imageUrl"
                :src="s.imageUrl"
                alt="service"
                class="h-10 w-10 object-cover rounded border"
              />
            </td>
            <td class="px-4 py-2 space-x-2">
              <button class="px-3 py-1 rounded bg-amber-500 text-white" @click="openEdit(s)">Edit</button>
              <button class="px-3 py-1 rounded bg-rose-600 text-white" @click="confirmDelete(s)">Delete</button>
            </td>
          </tr>

          <tr v-if="!loading && rows.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">No data</td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="p-6 text-center text-slate-500">Loading…</div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div class="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <h2 class="text-lg font-semibold mb-3">{{ form.id ? 'Edit Service' : 'Add Service' }}</h2>

        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1">Name</label>
            <input v-model="form.name" type="text" class="input" placeholder="Service name" />
          </div>

          <div>
            <label class="block text-sm mb-1">Price</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" class="input" />
          </div>

          <div>
            <label class="block text-sm mb-1">Description</label>
            <textarea v-model="form.description" rows="3" class="input"></textarea>
          </div>

          <!-- Image upload -->
          <div>
            <label class="block text-sm mb-1">Image</label>
            <div class="flex items-center gap-3">
              <input type="file" @change="onFileChange" accept="image/*" />
              <button
                v-if="pendingFile"
                class="px-3 py-1 rounded bg-slate-800 text-white"
                @click="uploadNow"
                :disabled="uploading"
              >{{ uploading ? 'Uploading…' : 'Upload' }}</button>
            </div>
            <p v-if="uploadError" class="text-rose-600 text-xs mt-1">{{ uploadError }}</p>
            <div v-if="form.imageUrl" class="mt-2">
              <img :src="form.imageUrl" class="h-20 rounded border" alt="" />
              <p class="text-xs text-slate-500 mt-1 break-all">{{ form.imageUrl }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input id="chk" v-model="form.isActive" type="checkbox" class="h-4 w-4" />
            <label for="chk" class="text-sm">Active</label>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button class="px-4 py-2 rounded bg-slate-200" @click="closeModal">Cancel</button>
          <button class="px-4 py-2 rounded bg-blue-600 text-white" @click="save" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="toDelete" class="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <p class="mb-4">Delete <b>{{ toDelete.name }}</b>?</p>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 rounded bg-slate-200" @click="toDelete=null">Cancel</button>
          <button class="px-4 py-2 rounded bg-rose-600 text-white" @click="doDelete">Delete</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ServiceApi } from '@/services/serviceApi'

const rows = ref([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const toDelete = ref(null)

// image upload state
const pendingFile = ref(null)
const uploading = ref(false)
const uploadError = ref('')

// NOTE: use imageUrl to match DB field
const form = ref({
  id: null, // serviceId
  name: '',
  price: 0,
  description: '',
  imageUrl: '',
  isActive: true
})

function formatMoney(n) {
  if (n == null) return ''
  return new Intl.NumberFormat().format(n)
}

async function load() {
  loading.value = true
  try {
    const { data } = await ServiceApi.list()
    rows.value = (data || []).map(x => ({
      serviceId: x.serviceId ?? x.serviceid ?? x.service_id ?? x.id,
      name: x.name,
      price: x.price,
      description: x.description,
      imageUrl: x.imageUrl ?? x.image_url ?? x.imagepath ?? x.imagePath, // tolerate old keys
      isActive: (x.isActive ?? x.isactive ?? true) ? true : false,
      createdAt: x.createdAt ?? x.created_at
    }))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = { id: null, name: '', price: 0, description: '', imageUrl: '', isActive: true }
  pendingFile.value = null
  uploadError.value = ''
  showModal.value = true
}

function openEdit(s) {
  form.value = {
    id: s.serviceId,
    name: s.name,
    price: s.price,
    description: s.description,
    imageUrl: s.imageUrl,
    isActive: s.isActive ? true : false
  }
  pendingFile.value = null
  uploadError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function onFileChange(e) {
  pendingFile.value = e.target.files && e.target.files[0] ? e.target.files[0] : null
  uploadError.value = ''
}

async function uploadNow() {
  if (!pendingFile.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    const { data } = await ServiceApi.uploadImage(pendingFile.value)
    // Expect { url, relativePath, ... }
    form.value.imageUrl = data?.url || ''
    pendingFile.value = null
  } catch (err) {
    uploadError.value = 'Upload failed'
    console.error(err)
  } finally {
    uploading.value = false
  }
}

async function save() {
  // minimal validation
  if (!form.value.name || form.value.price == null) {
    alert('Name and Price are required')
    return
  }

  saving.value = true
  const payload = {
    name: form.value.name,
    price: form.value.price,
    description: form.value.description,
    imageUrl: form.value.imageUrl, // <-- match DB field
    isActive: form.value.isActive
  }

  try {
    if (form.value.id) {
      await ServiceApi.update(form.value.id, payload)
    } else {
      await ServiceApi.create(payload)
    }
    await load()
    closeModal()
  } finally {
    saving.value = false
  }
}

function confirmDelete(s) { toDelete.value = s }

async function doDelete() {
  const id = toDelete.value?.serviceId
  if (!id) { toDelete.value = null; return }
  try {
    await ServiceApi.remove(id)
    await load()
  } finally {
    toDelete.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.input {
  @apply w-full rounded-xl border px-3 py-2 ring-1 ring-slate-200 focus:outline-none focus:ring-blue-400;
}
</style>

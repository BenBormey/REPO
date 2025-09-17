import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'
import '@/assets/tailwind.css'

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// After pinia is mounted, set Authorization header if token exists
const auth = useAuthStore()
if (auth.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`
}

app.mount('#app')

import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuth: (s) => !!s.token,
  },
  actions: {
    login({ token, user }) {
      this.token = token
      this.user  = user || null
     
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user || null))
     
    },
    logout() {
      this.token = null
      this.user  = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

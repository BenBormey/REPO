import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [], // { id, name, price, qty, image }
    shipping: 3,
    discount: 0
  }),
  getters: {
    subtotal: (s) => s.items.reduce((sum, it) => sum + it.price * it.qty, 0),
    total: (s) => (s.items.reduce((sum, it) => sum + it.price * it.qty, 0) - s.discount + s.shipping)
  },
  actions: {
    add(item, qty = 1) {
      const existing = this.items.find(i => i.id === item.id)
      if (existing) existing.qty += qty
      else this.items.push({ ...item, qty })
    },
    remove(id) { this.items = s.items.filter(i => i.id !== id) },
    setQty(id, qty) {
      const line = this.items.find(i => i.id === id)
      if (line) line.qty = qty
    },
    clear() { this.items = [] }
  }
})

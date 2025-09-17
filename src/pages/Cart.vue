<template>
  <section class="max-w-6xl mx-auto px-4 py-10">
    <h1 class="text-2xl sm:text-3xl font-semibold mb-6">Your Cart</h1>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-3">
        <div v-if="!cart.items.length" class="p-8 rounded-2xl border bg-gray-50 text-gray-500 text-center">
          Your cart is empty.
        </div>
        <div v-else v-for="it in cart.items" :key="it.id" class="p-4 rounded-2xl border bg-white flex items-center justify-between gap-4">
          <div>
            <div class="font-medium">{{ it.name }}</div>
            <div class="text-sm text-gray-500">${{ it.price.toFixed(2) }}</div>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" min="1" v-model.number="it.qty" class="w-20 input" />
            <button class="btn-outline" @click="remove(it.id)">Remove</button>
          </div>
        </div>
      </div>

      <aside class="md:col-span-1">
        <div class="p-4 rounded-2xl border bg-white space-y-2">
          <div class="flex justify-between"><span class="muted">Subtotal</span><b>${{ subtotal.toFixed(2) }}</b></div>
          <div class="flex justify-between"><span class="muted">Shipping</span><b>${{ cart.shipping.toFixed(2) }}</b></div>
          <div class="flex justify-between"><span class="muted">Discount</span><b>-${{ cart.discount.toFixed(2) }}</b></div>
          <hr>
          <div class="flex justify-between text-lg"><span>Total</span><b>${{ total.toFixed(2) }}</b></div>
          <router-link class="btn-primary block text-center mt-2" to="/checkout">Checkout</router-link>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const subtotal = computed(() => cart.items.reduce((s, it) => s + it.price * it.qty, 0))
const total = computed(() => subtotal.value - cart.discount + cart.shipping)
function remove(id) { cart.remove(id) }
</script>

<style scoped>
.muted { color: #6b7280 }
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px 12px; }
.btn-outline { padding: 8px 14px; border-radius: 10px; border: 1px solid #d1d5db; background: white; color: #111827; }
.btn-primary { padding: 10px 14px; border-radius: 12px; background: #2563eb; color: white; }
</style>

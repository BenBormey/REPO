<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="text-left text-gray-500">
        <tr>
          <th class="py-3">Item</th>
          <th class="py-3">Price</th>
          <th class="py-3">Qty</th>
          <th class="py-3">Subtotal</th>
          <th class="py-3"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="it in items" :key="it.id" class="border-t">
          <td class="py-3">
            <div class="flex items-center gap-3">
              <img :src="it.image" class="w-14 h-14 object-cover rounded-lg" alt="" />
              <div class="font-medium">{{ it.name }}</div>
            </div>
          </td>
          <td class="py-3">${{ money(it.price) }}</td>
          <td class="py-3">
            <div class="inline-flex items-center border rounded-lg overflow-hidden">
              <button class="px-2" @click="dec(it)">-</button>
              <input
                class="w-12 text-center outline-none"
                type="number" min="1"
                :value="it.qty"
                @input="onInput(it, $event)"
              />
              <button class="px-2" @click="inc(it)">+</button>
            </div>
          </td>
          <td class="py-3">${{ money(it.price * it.qty) }}</td>
          <td class="py-3 text-right">
            <button class="text-red-600 hover:underline" @click="$emit('remove', it.id)">Remove</button>
          </td>
        </tr>

        <tr v-if="!items?.length">
          <td colspan="5" class="py-8 text-center text-gray-500">Your cart is empty.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, required: true }
})
const emit = defineEmits(['qty','remove'])

const money = n => Number(n ?? 0).toFixed(2)

function onInput(it, e){
  const val = Math.max(1, parseInt(e.target.value || '1', 10))
  emit('qty', { id: it.id, qty: val })
}
function inc(it){ emit('qty', { id: it.id, qty: it.qty + 1 }) }
function dec(it){ emit('qty', { id: it.id, qty: Math.max(1, it.qty - 1) }) }
</script>

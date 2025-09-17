<template>
  <footer class="border-t bg-white mt-10">
    <div class="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-6">
      <div>
        <h3 class="font-semibold">Clinara</h3>
        <p class="text-sm text-gray-500 mt-2">Clean & simple home services.</p>
      </div>
      <div>
        <h4 class="font-medium">Links</h4>
        <ul class="mt-2 space-y-1 text-sm">
          <li><router-link to="/services">Services</router-link></li>
          <li><router-link to="/cart">Cart</router-link></li>
          <li><router-link to="/my-bookings">My Bookings</router-link></li>
        </ul>
      </div>
      <div>
        <h4 class="font-medium">Contact</h4>
        <p class="text-sm text-gray-500 mt-2">Phnom Penh, Cambodia</p>
      </div>
    </div>
    <div class="text-center text-xs text-gray-500 pb-6">© {{ new Date().getFullYear() }} Clinara</div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
</style>

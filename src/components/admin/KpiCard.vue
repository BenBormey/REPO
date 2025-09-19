<template>
  <div class="rounded-2xl border bg-white p-4">
    <div class="flex items-start justify-between">
      <div>
        <div class="text-sm text-gray-500">{{ title }}</div>
        <div class="text-2xl font-semibold mt-1">{{ value }}</div>

        <!-- trend -->
        <div
          v-if="trend !== undefined && trend !== null"
          class="mt-1 inline-flex items-center gap-1 text-xs"
          :class="Number(trend) >= 0 ? 'text-emerald-600' : 'text-rose-600'"
        >
          <span>{{ Number(trend) >= 0 ? '▲' : '▼' }}</span>
          <span>{{ Math.abs(Number(trend)).toFixed(1) }}%</span>
          <span class="text-gray-400">vs last 7d</span>
        </div>
      </div>

      <div class="text-2xl leading-none">{{ icon }}</div>
    </div>

    <!-- sparkline -->
    <svg v-if="points" viewBox="0 0 100 28" class="mt-3 w-full h-7">
      <polyline
        :points="points"
        :stroke="sparkStroke"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  trend?: number | null
  icon?: string
  spark?: number[] // array of numbers for sparkline
}

const props = defineProps<Props>()

// color based on trend
const sparkStroke = computed(() =>
  (props.trend ?? 0) >= 0 ? '#10b981' /* emerald-500 */ : '#f43f5e' /* rose-500 */
)

// convert spark array -> svg points
const points = computed(() => {
  const arr = props.spark ?? []
  if (!arr.length) return ''
  const max = Math.max(...arr)
  const min = Math.min(...arr)
  const normY = (v: number) => {
    if (max === min) return 14 // flat line center
    // map to [2,26] and invert so higher values go up
    return 26 - ((v - min) / (max - min)) * 24
  }
  const stepX = 100 / Math.max(arr.length - 1, 1)
  return arr.map((v, i) => `${i * stepX},${normY(Number(v))}`).join(' ')
})
</script>

<style scoped>
/* no extra styles needed; all Tailwind classes in template */
</style>

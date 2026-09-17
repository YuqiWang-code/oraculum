<template>
  <div class="hex-diagram">
    <div v-for="(l, i) in displayLines" :key="i" style="display:flex;align-items:center">
      <div :class="l === 1 ? 'line-yang' : 'line-yin'" style="flex:1"></div>
      <span v-if="moving && i === movingIdx" class="moving-mark">○动</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Lines, YinYang } from '../../types'

const props = defineProps<{
  lines: Lines
  moving?: boolean
  movingIndex0?: number
}>()

// 显示时从上到下（上爻在最上），数组自下而上，故反转
const displayLines = computed<YinYang[]>(() => [...props.lines].reverse())
const movingIdx = computed(() => (props.lines.length - 1 - (props.movingIndex0 ?? -1)))
</script>

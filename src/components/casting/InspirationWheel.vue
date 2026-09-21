<template>
  <div class="card">
    <h2>🎲 灵感转盘 <span class="tag cinnabar">只挑主题，不决定卦象</span></h2>
    <p class="muted">不知道问什么？转一下，帮你挑一个方向。真正的卦象仍由你之后摇铜钱产生。</p>

    <div class="wheel-wrap">
      <div class="wheel-pointer" />
      <div class="wheel" :style="{ transform: `rotate(${rotation}deg)` }">
        <span
          v-for="(s, i) in sectors"
          :key="s.label"
          class="w-label"
          :style="labelStyle(i)"
        >{{ s.icon }} {{ s.label }}</span>
      </div>
      <div class="wheel-hub">易</div>
    </div>

    <button class="btn cinnabar" :disabled="spinning" @click="spin">
      {{ spinning ? '转动中…' : '转一下，给我个方向' }}
    </button>
    <div v-if="picked" class="coin-result">就看看「{{ picked.label }}」吧，已帮你带好问题</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { secureRandomInt } from '../../engine/casting/secureRandom'
import { WHEEL_SECTORS } from '../../local-data/plainInterpretation'
import type { WheelSector } from '../../local-data/plainInterpretation'

const emit = defineEmits<{
  (e: 'pick', sector: WheelSector): void
}>()

const sectors = WHEEL_SECTORS
const N = sectors.length
const STEP = 360 / N
const spinning = ref(false)
const rotation = ref(0)
const picked = ref<WheelSector | null>(null)

function labelStyle(i: number) {
  const angle = i * STEP + STEP / 2
  return {
    transform: `rotate(${angle}deg) translateY(-92px)`,
    width: '72px',
    marginLeft: '-36px',
    textAlign: 'center' as const
  }
}

function spin() {
  if (spinning.value) return
  spinning.value = true
  // 仅用于挑选主题的随机数，不参与、也不影响后续起卦随机过程。
  const idx = secureRandomInt(0, N - 1)
  const target = idx * STEP + STEP / 2
  const current = rotation.value % 360
  const base = rotation.value - current + 360 * 5
  rotation.value = base + (360 - target)
  window.setTimeout(() => {
    spinning.value = false
    picked.value = sectors[idx]
    emit('pick', sectors[idx])
  }, 2650)
}
</script>

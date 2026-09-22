<template>
  <div class="card wheel-card">
    <h2>🎲 灵感转盘 <span class="tag cinnabar">只挑主题，不决定卦象</span></h2>
    <p class="muted">不知道问什么？转一下，帮你挑一个方向。真正的卦象仍由你之后摇铜钱产生。</p>

    <div class="wheel-wrap">
      <div class="wheel" :style="{ transform: `rotate(${rotation}deg)` }">
        <i
          v-for="k in N"
          :key="'seg' + k"
          class="wheel-seg"
          :style="{ transform: `rotate(${(k - 1) * STEP}deg)` }"
          aria-hidden="true"
        ></i>
        <span
          v-for="(s, i) in sectors"
          :key="s.label"
          class="w-label"
          :class="{ win: picked && picked.label === s.label }"
          :style="labelStyle(i)"
        >
          <b class="wl-icon">{{ s.icon }}</b>
          <em class="wl-text">{{ s.label }}</em>
        </span>
      </div>
      <div class="wheel-hub">易</div>
    </div>

    <button class="btn cinnabar" :disabled="spinning" @click="spin">
      {{ spinning ? '转动中…' : '转一下，给我个方向' }}
    </button>
    <Transition name="fade-up">
      <div v-if="picked" class="wheel-result">
        <span class="wr-icon">{{ picked.icon }}</span>
        就看看「{{ picked.label }}」吧，已帮你带好问题
      </div>
    </Transition>
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
const SPIN_TURNS = 6
const spinning = ref(false)
// 始终是 360 的整数倍：转盘每次整圈旋转、停正，保证所有文字水平正向。
const rotation = ref(0)
const picked = ref<WheelSector | null>(null)

// 标签先随扇形转到对应方位、平移到外圈，再反向转回水平，文字永远正向、不镜像。
function labelStyle(i: number) {
  const angle = i * STEP + STEP / 2
  return {
    transform: `rotate(${angle}deg) translateY(calc(-1 * var(--wr))) rotate(${-angle}deg)`
  }
}

function spin() {
  if (spinning.value) return
  spinning.value = true
  picked.value = null
  // 仅用于挑选主题的随机数，不参与、也不影响后续起卦随机过程。
  const idx = secureRandomInt(0, N - 1)
  // 视觉上整圈旋转后停正；中奖主题由高亮扇区与结果文字标明。
  rotation.value += 360 * SPIN_TURNS
  window.setTimeout(() => {
    spinning.value = false
    picked.value = sectors[idx]
    emit('pick', sectors[idx])
  }, 2850)
}
</script>

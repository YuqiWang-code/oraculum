<template>
  <div class="card coin-card">
    <h2>🪙 摇铜钱，问六次 <span class="tag cinnabar">传统六爻</span></h2>
    <p class="muted">
      心里想着问题，每次摇三枚铜钱，一共六次。动画只是样子，结果仍由本地随机规则产生，和真摇铜钱一致。
    </p>

    <!-- 六步进度 -->
    <div class="throw-dots">
      <span
        v-for="i in 6"
        :key="i"
        :class="['td', throws.length >= i ? 'done' : (throws.length === i - 1 ? 'current' : '')]"
      />
    </div>
    <div class="coin-result">
      <template v-if="throws.length < 6">第 {{ throws.length + 1 }} 次问天（共六次）</template>
      <template v-else>六次已完成，可以生成卦象了</template>
    </div>

    <!-- 三枚铜钱 -->
    <div class="coin-stage">
      <span
        v-for="i in 3"
        :key="i"
        :class="['coin', coinClass(i - 1)]"
        :style="coinStyle(i - 1)"
      >
        <span class="face front">字</span>
        <span class="face back">背</span>
      </span>
    </div>

    <div v-if="current" class="coin-result" aria-live="polite">{{ friendlyLine(current.sum) }}</div>

    <button
      v-if="throws.length < 6"
      class="btn cinnabar"
      :disabled="animating"
      @click="throwOnce"
    >{{ animating ? '铜钱落下中…' : `摇第 ${throws.length + 1} 次` }}</button>

    <div v-else class="card" style="margin:10px 0;background:var(--paper-2)">
      <button class="btn" @click="confirm">生成卦象</button>
      <button class="btn secondary" @click="reset">重新摇</button>
    </div>

    <!-- 已得的爻（自上而下显示，第1次在最下） -->
    <div v-if="throws.length" class="lines-preview">
      <template v-for="n in 6" :key="n">
        <div v-if="throws[6 - n]">
          <div :class="sumToYinYang(throws[6 - n].sum) ? 'line-yang' : 'line-yin'" />
          <span v-if="isMoving(throws[6 - n].sum)" class="moving-mark">动</span>
        </div>
        <div v-else class="line-placeholder" />
      </template>
    </div>

    <details class="guofeng" style="margin:10px 0 0">
      <summary>这些数字是什么意思？</summary>
      <div class="details-body">
        <p class="muted">
          正面（有字）记 3，反面（背）记 2，三枚相加：6 为阴且会变化，7 为阳平稳，
          8 为阴平稳，9 为阳且会变化。第一次是最下面一爻，依次向上。
        </p>
        <div v-for="(t, i) in throws" :key="i" class="muted" style="display:flex;justify-content:space-between;padding:3px 0">
          <span>第{{ i + 1 }}次</span>
          <span>{{ t.coins.join('+') }}={{ t.sum }}（{{ sumName(t.sum) }}）</span>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { flipOnce, throwsToLines, sumToLine, type CoinThrow } from '../../engine/casting/castByCoins'

const emit = defineEmits<{
  (e: 'confirm', payload: { lines: number[]; movingMask: boolean[]; throws: CoinThrow[] }): void
}>()

const throws = ref<CoinThrow[]>([])
const current = ref<CoinThrow | null>(null)
const animating = ref(false)

function throwOnce() {
  if (throws.value.length >= 6 || animating.value) return
  // 严格一次 flipOnce：随机结果在摇下瞬间确定，动画只负责把它演出来。
  const t = flipOnce()
  current.value = t
  animating.value = true
  window.setTimeout(() => {
    throws.value.push(t)
    animating.value = false
  }, 920)
}

function coinClass(i: number) {
  if (!current.value) return ''
  if (animating.value) return 'flipping'
  return current.value.coins[i] === 2 ? 'show-back' : ''
}

function coinStyle(i: number) {
  if (animating.value && current.value) {
    const rot = current.value.coins[i] === 2 ? 180 : 0
    return { '--final-rot': `${rot}deg` } as Record<string, string>
  }
  return {}
}

function sumToYinYang(sum: number) {
  return sumToLine(sum as 6 | 7 | 8 | 9).yinYang === 1
}
function isMoving(sum: number) {
  return sumToLine(sum as 6 | 7 | 8 | 9).moving
}
function sumName(sum: number) {
  return { 6: '老阴·动', 7: '少阳', 8: '少阴', 9: '老阳·动' }[sum] ?? ''
}
function friendlyLine(sum: number) {
  switch (sum) {
    case 9: return '这一爻是阳，而且正在起变化'
    case 8: return '这一爻是阴，比较平稳'
    case 7: return '这一爻是阳，比较平稳'
    case 6: return '这一爻是阴，而且正在起变化'
    default: return ''
  }
}

function reset() {
  throws.value = []
  current.value = null
}

function confirm() {
  const { lines, movingMask } = throwsToLines(throws.value)
  emit('confirm', { lines, movingMask, throws: throws.value })
}
</script>

<style scoped>
.lines-preview { width: 120px; margin: 14px auto 4px; }
.line-placeholder { height: 10px; margin: 8px 0; border: 1px dashed var(--line); border-radius: 2px; }
</style>

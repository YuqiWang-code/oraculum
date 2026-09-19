<template>
  <div class="card">
    <h2>六爻 · 三枚钱 <span class="tag">传统实践</span></h2>
    <div class="muted">正面=3 反面=2。连续六次，第一次为初爻。和：6老阴动 / 7少阳 / 8少阴 / 9老阳动。</div>
    <div v-for="(t, i) in throws" :key="i" style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed var(--line)">
      <span>第{{ i + 1 }}次（{{ lineName(i) }}）</span>
      <span>{{ t.coins.join('+') }}={{ t.sum }} {{ sumLabel(t.sum) }}</span>
    </div>
    <div v-if="throws.length === 0" class="muted" style="padding:10px 0">尚未投掷</div>
    <button class="btn secondary" @click="throwOnce">投第 {{ throws.length + 1 }} 次</button>
    <button class="btn" :disabled="throws.length < 6" @click="confirm">六次完成，起卦</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { flipOnce, throwsToLines, CoinThrow } from '../../engine/casting/castByCoins'

const emit = defineEmits<{
  (e: 'confirm', payload: { lines: number[]; movingMask: boolean[]; throws: CoinThrow[] }): void
}>()
const throws = ref<CoinThrow[]>([])

function throwOnce() {
  if (throws.value.length >= 6) return
  throws.value.push(flipOnce())
}
function lineName(i: number) {
  return ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i]
}
function sumLabel(s: number) {
  return { 6: '老阴·动', 7: '少阳', 8: '少阴', 9: '老阳·动' }[s]
}
function confirm() {
  const { lines, movingMask } = throwsToLines(throws.value)
  emit('confirm', { lines, movingMask, throws: throws.value })
}
</script>

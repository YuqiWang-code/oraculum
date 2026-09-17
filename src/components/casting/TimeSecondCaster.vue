<template>
  <div class="card">
    <h2>梅花 · 秒级时间 <span class="tag">现代扩展</span></h2>
    <div class="muted">实时本地时间，点击锁定此刻并起卦（秒参与算法）。</div>
    <div style="font-size:28px;text-align:center;margin:12px 0">{{ nowText }}</div>
    <div class="muted" style="text-align:center">
      A=年支+农历月+日，B=A+时支，P=分×60+秒
    </div>
    <label>或手工指定（精确到秒）</label>
    <input type="datetime-local" step="1" :value="manual" @change="manual = ($event.target as HTMLInputElement).value" />
    <button class="btn" @click="confirm">锁定此刻并起卦</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { formatDateTimeLocalSeconds, formatDisplaySeconds } from '../../utils/datetime'

const emit = defineEmits<{ (e: 'confirm', payload: { useManual?: string }): void }>()
const nowText = ref('')
const manual = ref(formatDateTimeLocalSeconds(new Date()))
let timer: ReturnType<typeof setInterval> | null = null

function tick() {
  nowText.value = formatDisplaySeconds(new Date())
}
onMounted(() => { tick(); timer = setInterval(tick, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

function confirm() {
  // 若用户改过 manual 则用 manual，否则用当前实时时间
  emit('confirm', { useManual: manual.value })
}
</script>

<template>
  <div class="card">
    <h2>梅花 · 秒级时间 <span class="tag">现代扩展</span></h2>
    <div class="muted">实时本地时间，点击"锁定当前这一秒并起卦"（秒参与算法）。</div>
    <div style="font-size:28px;text-align:center;margin:12px 0">{{ nowText }}</div>
    <div class="muted" style="text-align:center">
      A=年支+农历月+日，B=A+时支，P=分×60+秒
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
      <button class="btn" @click="useNow">锁定当前这一秒并起卦</button>
      <div class="muted">或手工指定（精确到秒）：</div>
      <input type="datetime-local" step="1" v-model="manual" />
      <button class="btn secondary" @click="useManual">按指定时间起卦</button>
    </div>
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

// v3.1 修复：点击"当前"时在点击瞬间取 new Date()，不用 mount 时固定的 manual
function useNow() {
  emit('confirm', { useManual: formatDateTimeLocalSeconds(new Date()) })
}
function useManual() {
  if (!manual.value) { alert('请选择时间'); return }
  emit('confirm', { useManual: manual.value })
}
</script>

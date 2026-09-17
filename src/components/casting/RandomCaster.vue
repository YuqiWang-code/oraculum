<template>
  <div class="card">
    <h2>梅花 · 随机数 <span class="tag">现代数字化</span></h2>
    <div class="muted">crypto 安全随机生成 N1/N2/N3（1–9999）。先看数，再确认。</div>
    <div v-if="!n1" style="text-align:center;padding:20px;color:var(--muted)">尚未生成</div>
    <div v-else style="font-size:20px;margin:10px 0">
      <div>N1：{{ n1 }}</div><div>N2：{{ n2 }}</div><div>N3：{{ n3 }}</div>
    </div>
    <button class="btn secondary" @click="gen">生成</button>
    <button class="btn" :disabled="!n1" @click="confirm">确认并起卦</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { rollRandomNumbers } from '../../engine/casting/castByRandomNumbers'

const emit = defineEmits<{ (e: 'confirm', payload: { numbers: [number, number, number] }): void }>()
const n1 = ref(0), n2 = ref(0), n3 = ref(0)
function gen() {
  const [a, b, c] = rollRandomNumbers()
  n1.value = a; n2.value = b; n3.value = c
}
function confirm() {
  emit('confirm', { numbers: [n1.value, n2.value, n3.value] })
}
</script>

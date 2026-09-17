<template>
  <div class="card">
    <h2>梅花 · 外应 <span class="tag">传统+规范化</span></h2>
    <div class="muted">传统外应思想 + 本项目规范化实现（非古籍唯一公式）。</div>
    <label>取象方式</label>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button :class="['chip', kind==='color'?'on':'']" @click="kind='color'">验色</button>
      <button :class="['chip', kind==='symbol'?'on':'']" @click="kind='symbol'">八象</button>
    </div>
    <template v-if="kind==='color'">
      <div class="chips">
        <button v-for="c in colors" :key="c" :class="['chip', value===c?'on':'']" @click="value=c">{{ c }}</button>
      </div>
    </template>
    <template v-else>
      <div class="chips">
        <button v-for="s in symbols" :key="s" :class="['chip', value===s?'on':'']" @click="value=s">{{ s }}</button>
      </div>
    </template>
    <label>所见方位</label>
    <div class="chips">
      <button v-for="d in directions" :key="d" :class="['chip', dir===d?'on':'']" @click="dir=d">{{ d }}</button>
    </div>
    <button class="btn" :disabled="!value || !dir" @click="confirm">起卦</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'confirm', payload: { kind: 'color' | 'symbol'; value: string; direction: string }): void }>()
const kind = ref<'color' | 'symbol'>('symbol')
const value = ref('')
const dir = ref('')
const colors = ['青', '红', '黄', '白', '黑']
const symbols = ['天', '泽', '火', '雷', '风', '水', '山', '地']
const directions = ['西北', '西', '南', '东', '东南', '北', '东北', '西南']
function confirm() { emit('confirm', { kind: kind.value, value: value.value, direction: dir.value }) }
</script>

<style scoped>
.chips { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px }
.chip { padding:6px 10px;border:1px solid var(--line);border-radius:16px;background:transparent;color:var(--text) }
.chip.on { background:var(--accent);color:#fff;border-color:var(--accent) }
</style>

<template>
  <div class="card">
    <h2>梅花 · 摇骰 <span class="tag">现代交互</span></h2>
    <div class="muted">d8×2 定上下卦（1乾…8坤），d6 定动爻。可虚拟摇或手工输入实体骰。</div>
    <div style="display:flex;gap:12px;justify-content:center;font-size:30px;margin:14px 0">
      <div :class="['die', rolling ? 'rolling' : '']">{{ upperD8 || '?' }}</div>
      <div :class="['die', rolling ? 'rolling' : '']">{{ lowerD8 || '?' }}</div>
      <div :class="['die d6', rolling ? 'rolling' : '']">{{ movingD6 || '?' }}</div>
    </div>
    <div style="display:flex;gap:8px">
      <input type="number" min="1" max="8" v-model.number="mUpper" placeholder="上d8" />
      <input type="number" min="1" max="8" v-model.number="mLower" placeholder="下d8" />
      <input type="number" min="1" max="6" v-model.number="mMove" placeholder="动d6" />
    </div>
    <button class="btn secondary" @click="roll">虚拟摇骰</button>
    <button class="btn" @click="confirmManual">用手工输入起卦</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { rollDice } from '../../engine/casting/castByDice'

const emit = defineEmits<{ (e: 'confirm', payload: { upperD8: number; lowerD8: number; movingD6: number }): void }>()
const upperD8 = ref(0), lowerD8 = ref(0), movingD6 = ref(0)
const rolling = ref(false)
const mUpper = ref<number>(), mLower = ref<number>(), mMove = ref<number>()

function roll() {
  rolling.value = true
  setTimeout(() => {
    const d = rollDice()
    upperD8.value = d.upperD8; lowerD8.value = d.lowerD8; movingD6.value = d.movingD6
    rolling.value = false
    emit('confirm', d)
  }, 500)
}
function confirmManual() {
  if (!mUpper.value || !mLower.value || !mMove.value) { alert('请填入三个骰子点数'); return }
  emit('confirm', { upperD8: mUpper.value, lowerD8: mLower.value, movingD6: mMove.value })
}
</script>

<style scoped>
.die { width: 48px; height: 48px; border: 2px solid var(--accent); border-radius: 10px; display:flex; align-items:center; justify-content:center; }
.d6 { border-radius: 50%; }
.rolling { opacity: 0.4; }
</style>

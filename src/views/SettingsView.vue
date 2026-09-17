<template>
  <div>
    <h1>设置</h1>
    <div class="card">
      <label>时区</label>
      <select v-model="tz">
        <option value="Asia/Shanghai">Asia/Shanghai</option>
        <option value="UTC">UTC</option>
      </select>

      <label>日界规则说明</label>
      <div class="muted">默认按 00:00 换日；传统另有子初 23:00 换日之说。v1 默认 00:00，结果页保存当次设置。</div>
      <select v-model="boundary">
        <option value="00:00">00:00（现代公历日界）</option>
        <option value="23:00">23:00（子初换日，传统说法）</option>
      </select>

      <label style="display:flex;align-items:center;gap:8px;margin-top:12px">
        <input type="checkbox" v-model="shensha" style="width:auto" />
        神煞参与评分（关闭后仍展示，仅低权重）
      </label>

      <label style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" v-model="detail" style="width:auto" />
        显示农历扩展信息
      </label>
    </div>
    <button class="btn" @click="save">保存设置</button>
    <div class="card muted">所有计算均在本地完成，不依赖云端，不上传任何数据。</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
const store = useAppStore()
const tz = ref(store.settings.timezone)
const boundary = ref(store.settings.dayBoundaryRule)
const shensha = ref(store.settings.useShenshaInScore)
const detail = ref(store.settings.showLunarDetail)

async function save() {
  await store.updateSettings({ timezone: tz.value, dayBoundaryRule: boundary.value, useShenshaInScore: shensha.value, showLunarDetail: detail.value })
  alert('已保存')
}
</script>

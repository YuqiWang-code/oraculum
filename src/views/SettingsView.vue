<template>
  <div>
    <h1>设置</h1>
    <div class="card">
      <label>时区</label>
      <select v-model="tz">
        <option value="Asia/Shanghai">Asia/Shanghai（中国标准时间）</option>
        <option value="UTC">UTC</option>
      </select>

      <label>日界规则</label>
      <div class="muted">默认按 00:00 换日；传统另有子初 23:00 换日之说。</div>
      <select v-model="boundary">
        <option value="midnight">00:00（现代公历日界）</option>
        <option value="zi_hour">23:00（子初换日，传统说法）</option>
      </select>

      <label style="display:flex;align-items:center;gap:8px;margin-top:12px">
        <input type="checkbox" v-model="shensha" style="width:auto" />
        神煞参与评分（关闭后仍展示，仅低权重）
      </label>

      <label style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" v-model="detail" style="width:auto" />
        显示农历扩展信息
      </label>

      <label style="display:block;margin-top:12px">阅读模式</label>
      <div class="muted">选择结果页默认展示方式。</div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:4px">
        <input type="radio" value="simple" v-model="readingMode" style="width:auto" />
        简明模式（默认）：一句话 + 现实白话 + 必要传统信息
      </label>
      <label style="display:flex;align-items:center;gap:8px">
        <input type="radio" value="research" v-model="readingMode" style="width:auto" />
        研究模式：完整显示经典、详细规则、评分依据
      </label>
    </div>
    <button class="btn" @click="save">保存设置</button>

    <div class="card muted">
      Oraculum v{{ appVersion }}：核心计算与解读完全本地、离线可用，无需后端、无需 API Key、无需 AI。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { APP_VERSION } from '../types'

const store = useAppStore()
const appVersion = APP_VERSION
const tz = ref(store.settings.timezone)
const boundary = ref<'midnight' | 'zi_hour'>(store.settings.dayBoundaryRule)
const shensha = ref(store.settings.useShenshaInScore)
const detail = ref(store.settings.showLunarDetail)
const readingMode = ref<'simple' | 'research'>(
  store.settings.readingMode
    ?? (store.settings.resultDisplayMode === 'detailed_only' ? 'research' : 'simple')
)

async function save() {
  const mode = readingMode.value
  await store.updateSettings({
    timezone: tz.value,
    dayBoundaryRule: boundary.value,
    useShenshaInScore: shensha.value,
    showLunarDetail: detail.value,
    readingMode: mode,
    // 兼容旧 resultDisplayMode：simple→full_with_plain，research→detailed_only
    resultDisplayMode: mode === 'simple' ? 'full_with_plain' : 'detailed_only'
  })
  alert('已保存')
}
</script>

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

    <div class="card">
      <h2>AI 深度解读</h2>
      <div class="muted">AI 为可选增强，需要联网；关闭 AI 不影响本地确定性起卦。</div>
      <div>服务状态：<b>{{ healthText }}</b></div>
      <label>AI 访问口令（只存本机，不同步）</label>
      <input v-model="token" type="password" placeholder="服务端设置的 AI_ACCESS_TOKEN" />
      <button class="btn secondary" @click="testConn">测试连接</button>
    </div>

    <div class="card muted">
      本地传统引擎离线可用；AI 深度解读可选、需要联网。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { checkAiHealth, getAiToken, setAiToken } from '../services/ai'
const store = useAppStore()
const tz = ref(store.settings.timezone)
const boundary = ref(store.settings.dayBoundaryRule)
const shensha = ref(store.settings.useShenshaInScore)
const detail = ref(store.settings.showLunarDetail)
const token = ref(getAiToken())
const healthText = ref('未检测')

async function save() {
  await store.updateSettings({ timezone: tz.value, dayBoundaryRule: boundary.value, useShenshaInScore: shensha.value, showLunarDetail: detail.value })
  setAiToken(token.value.trim())
  alert('已保存')
}

async function testConn() {
  setAiToken(token.value.trim())
  const h = await checkAiHealth()
  healthText.value = h.enabled ? `已连接（${h.model}）` : '未配置（后端未设置 API key）'
}
</script>

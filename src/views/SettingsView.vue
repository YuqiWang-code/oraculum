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

    <div class="card">
      <h2>隐私与存储</h2>
      <ul class="privacy-list">
        <li>✓ 问卦历史仅保存在本机浏览器（IndexedDB）</li>
        <li>✓ 出生档案仅在勾选"保存本地档案"后才保存到本机</li>
        <li>✓ 不上传 Cloudflare，不跨设备自动同步</li>
        <li>✓ 导出 / 导入 JSON 只有用户主动操作才会移动数据</li>
        <li>Cloudflare 仅托管静态应用文件，不存储问卦历史或出生档案</li>
      </ul>

      <div v-if="storageSupported" style="margin-top:12px">
        <button class="btn secondary" @click="showStorage">查看本机存储用量</button>
        <div class="muted" v-if="storageUsed !== null" style="margin-top:8px">
          本机站点存储：{{ storageUsed }}<span v-if="storageQuota !== null">（可用上限约 {{ storageQuota }}）</span><br />
          问卦历史：{{ historyCount }} 条 · 出生档案：{{ profileCount }} 条
        </div>
      </div>
    </div>

    <div class="card muted">
      Oraculum v{{ appVersion }}：核心计算与解读完全本地、离线可用，无需后端、无需 API Key、无需 AI。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { APP_VERSION } from '../types'
import { listHistory, listFortuneProfiles } from '../db'

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

// 本机存储用量（navigator.storage.estimate），不支持时隐藏，不报错
const storageSupported = typeof navigator !== 'undefined'
  && 'storage' in navigator
  && typeof navigator.storage?.estimate === 'function'
const storageUsed = ref<string | null>(null)
const storageQuota = ref<string | null>(null)
const historyCount = ref(0)
const profileCount = ref(0)

function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return mb.toFixed(2) + ' MB'
  return (bytes / 1024).toFixed(1) + ' KB'
}

async function loadCounts() {
  try {
    const [h, p] = await Promise.all([listHistory(10000), listFortuneProfiles(10000)])
    historyCount.value = h.length
    profileCount.value = p.length
  } catch {
    // 计数失败不影响页面
  }
}

async function showStorage() {
  if (!storageSupported) return
  try {
    const est = await navigator.storage.estimate()
    storageUsed.value = formatMB(est.usage ?? 0)
    if (est.quota) storageQuota.value = formatMB(est.quota)
  } catch {
    // 读取失败时保持隐藏，不报错
  }
}

onMounted(() => { loadCounts() })

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

<style scoped>
.privacy-list {
  margin: 8px 0;
  padding-left: 20px;
  line-height: 1.8;
}
</style>

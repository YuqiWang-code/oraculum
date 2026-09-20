<template>
  <div>
    <h1>历史记录</h1>
    <div class="card">
      <input v-model="kw" placeholder="搜索问题文本…" />
      <div style="display:flex;gap:8px">
        <button class="btn secondary" style="margin:6px 0" @click="doExport">导出 JSON</button>
        <button class="btn secondary" style="margin:6px 0" @click="doImport">导入 JSON</button>
        <button class="btn secondary" style="margin:6px 0" @click="doClear">清空</button>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:4px">
        <input type="checkbox" v-model="exportProfiles" style="width:auto" />
        同时导出出生档案（默认不导出）
      </label>
      <input ref="fileInput" type="file" accept="application/json" style="display:none" @change="onFile" />
    </div>

    <div class="card">
      <h2>隐私与存储</h2>
      <ul class="privacy-list">
        <li>✓ 问卦历史仅保存在本机浏览器（IndexedDB）</li>
        <li>✓ 出生档案仅在勾选"保存本地档案"后才保存到本机</li>
        <li>✓ 不上传 Cloudflare，不跨设备自动同步</li>
        <li>✓ 导出 / 导入 JSON 只有用户主动操作才会移动数据</li>
        <li>Cloudflare 仅托管静态应用文件，不存储问卦历史或出生档案</li>
      </ul>
    </div>

    <div class="card" v-for="r in filtered" :key="r.id">
      <div @click="view(r)" style="cursor:pointer">
        <span :class="cls(r.label)">{{ r.label }} {{ r.score }}</span>
        {{ r.hexagramName }} · {{ r.question }}
        <div class="muted">{{ fmtTime(r) }} 规则 {{ r.ruleVersion }}</div>
      </div>
      <button class="btn secondary" @click="remove(r.id)">删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listHistory, deleteRecord, clearHistory, exportAll, importAll } from '../db'
import type { HistoryRecord } from '../db/schema'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()
const rows = ref<HistoryRecord[]>([])
const kw = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const exportProfiles = ref(false)

const filtered = computed(() => rows.value.filter((r) => !kw.value || r.question.includes(kw.value)))

function cls(l: string) {
  return l === '大吉' || l === '吉' ? 'label-good' : l === '大凶' || l === '凶' ? 'label-bad' : 'label-flat'
}

/** 用记录自身的时区格式化起卦时间，而非浏览器本地时区 */
function fmtTime(r: HistoryRecord): string {
  const tz = r.input?.timezone || 'Asia/Shanghai'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(r.createdAt))
}
onMounted(async () => { rows.value = await listHistory() })

function view(r: HistoryRecord) {
  store.lastResult = r
  router.push('/result/' + r.id)
}
async function remove(id: string) {
  await deleteRecord(id)
  rows.value = await listHistory()
}
async function doClear() {
  if (confirm('确定清空全部历史？此操作不可恢复。')) { await clearHistory(); rows.value = [] }
}
async function doExport() {
  const tip = exportProfiles.value
    ? '将导出问卦历史与出生档案。导出后文件由您自己保管，请妥善存放。'
    : '将导出问卦历史（不含出生档案）。导出后文件由您自己保管，请妥善存放。'
  if (!confirm(tip)) return
  const json = await exportAll({ includeFortuneProfiles: exportProfiles.value })
  const blob = new Blob([json], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `divination-history-${Date.now()}.json`
  a.click()
}
function doImport() { fileInput.value?.click() }
async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const text = await f.text()
  const n = await importAll(text)
  alert(`已导入 ${n} 条`)
  rows.value = await listHistory()
}
</script>

<style scoped>
.privacy-list {
  margin: 8px 0;
  padding-left: 20px;
  line-height: 1.8;
}
</style>

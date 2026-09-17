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
      <input ref="fileInput" type="file" accept="application/json" style="display:none" @change="onFile" />
    </div>

    <div class="card" v-for="r in filtered" :key="r.id">
      <div @click="view(r)" style="cursor:pointer">
        <span :class="cls(r.label)">{{ r.label }} {{ r.score }}</span>
        {{ r.hexagramName }} · {{ r.question }}
        <div class="muted">{{ new Date(r.createdAt).toLocaleString('zh-CN') }}　规则 {{ r.ruleVersion }}</div>
      </div>
      <button class="btn secondary" @click="remove(r.id)">删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listHistory, deleteRecord, clearHistory, exportAll, importAll } from '../db'
import type { HistoryRecord } from '../db/schema'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const rows = ref<HistoryRecord[]>([])
const kw = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const filtered = computed(() => rows.value.filter((r) => !kw.value || r.question.includes(kw.value)))

function cls(l: string) {
  return l === '大吉' || l === '吉' ? 'label-good' : l === '大凶' || l === '凶' ? 'label-bad' : 'label-flat'
}
onMounted(async () => { rows.value = await listHistory() })

function view(r: HistoryRecord) {
  store.lastResult = r
  location.href = '#/result'
}
async function remove(id: string) {
  await deleteRecord(id)
  rows.value = await listHistory()
}
async function doClear() {
  if (confirm('确定清空全部历史？此操作不可恢复。')) { await clearHistory(); rows.value = [] }
}
async function doExport() {
  const json = await exportAll()
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

<template>
  <div>
    <h1>问卦</h1>
    <div class="card">
      <label>所问之事</label>
      <textarea v-model="question" rows="3" placeholder="例如：这份工作机会该不该接？"></textarea>
      <label>问题类别</label>
      <select v-model="category">
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <label>姓名/代号（可选）</label>
      <input v-model="alias" placeholder="仅用于记录与称呼" />
      <label>性别（可选，默认不参与起卦）</label>
      <select v-model="gender">
        <option value="unspecified">不指定</option>
        <option value="male">男</option>
        <option value="female">女</option>
      </select>
    </div>

    <h2 style="margin:16px 0 8px">选择起卦方式</h2>
    <div class="method-grid">
      <button v-for="m in methods" :key="m.key" :class="['method-card', mode===m.key?'on':'']" @click="mode=m.key">
        <div class="m-icon">{{ m.icon }}</div>
        <div class="m-name">{{ m.name }}</div>
        <div class="m-desc">{{ m.desc }}</div>
        <span :class="['badge', m.tier]">{{ m.badge }}</span>
      </button>
    </div>

    <TimeSecondCaster v-if="mode==='meihua_time_second'" @confirm="onSecondTime" />
    <RandomCaster v-else-if="mode==='meihua_random'" @confirm="onRandom" />
    <DiceCaster v-else-if="mode==='meihua_dice'" @confirm="onDice" />
    <CoinCaster v-else-if="mode==='liuyao_coins'" @confirm="onCoins" />
    <TextCaster v-else-if="mode==='meihua_text'" :default-text="question" @confirm="onText" />
    <OmenCaster v-else-if="mode==='meihua_external_omen'" @confirm="onOmen" />
    <SixSourceWizard v-else-if="mode==='six_source_hybrid'" @confirm="onSixSource" />

    <div class="card muted">
      姓名与性别不参与数学起卦，仅用于记录。本工具为传统文化研究与娱乐用途。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { QUESTION_CATEGORIES } from '../engine/interpretation/classifyQuestion'
import {
  runMeihuaTime, runMeihuaSecondTime, runMeihuaRandom, runMeihuaDice,
  runMeihuaText, runMeihuaOmen, runSixSourceHybrid, runLiuyao
} from '../engine/orchestrator'
import { saveRecord } from '../db'
import { formatDateTimeLocalSeconds, parseLocalDateTime } from '../utils/datetime'
import type { QuestionCategory, Gender, CastingMode } from '../types'
import type { SixSourcePayload } from '../types'
import TimeSecondCaster from '../components/casting/TimeSecondCaster.vue'
import RandomCaster from '../components/casting/RandomCaster.vue'
import DiceCaster from '../components/casting/DiceCaster.vue'
import CoinCaster from '../components/casting/CoinCaster.vue'
import TextCaster from '../components/casting/TextCaster.vue'
import OmenCaster from '../components/casting/OmenCaster.vue'
import SixSourceWizard from '../components/casting/SixSourceWizard.vue'

const router = useRouter()
const store = useAppStore()

const question = ref('')
const category = ref<QuestionCategory>('日常综合')
const alias = ref('')
const gender = ref<Gender>('unspecified')
const mode = ref<CastingMode>('six_source_hybrid')
const timezone = ref('Asia/Shanghai')
const categories = QUESTION_CATEGORIES

const methods = [
  { key: 'six_source_hybrid', name: '六源合参', desc: '六点合一，实验模式', badge: '实验', tier: 'warn', icon: '☯' },
  { key: 'meihua_time_second', name: '秒级时间', desc: '精确到秒参与算法', badge: '现代扩展', tier: 'info', icon: '⏱' },
  { key: 'meihua_random', name: '随机数', desc: '安全随机取数', badge: '现代数字化', tier: 'info', icon: '🎲' },
  { key: 'meihua_dice', name: '摇骰子', desc: 'd8×2 + d6', badge: '现代交互', tier: 'info', icon: '⚂' },
  { key: 'liuyao_coins', name: '三枚钱', desc: '传统六爻', badge: '传统实践', tier: 'ok', icon: '🪙' },
  { key: 'meihua_text', name: '文字', desc: '所问字数', badge: '传统', tier: 'ok', icon: '✍' },
  { key: 'meihua_external_omen', name: '外应', desc: '见象/色/方位', badge: '传统+规范', tier: 'ok', icon: '👁' }
] as const

function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

function buildInput(castTimeLocal: string) {
  const d = castTimeLocal ? parseLocalDateTime(castTimeLocal) : new Date()
  return {
    id: id(),
    createdAt: new Date().toISOString(),
    timezone: timezone.value,
    question: question.value.trim(),
    category: category.value,
    querentAlias: alias.value || undefined,
    gender: gender.value,
    castingMode: mode.value,
    castTime: d.toISOString()
  }
}

async function finish(rec: Awaited<ReturnType<typeof runMeihuaTime>>) {
  if (!question.value.trim()) { alert('请输入所问之事'); return }
  store.lastResult = rec
  await saveRecord(rec)
  router.push('/result')
}

function onSecondTime(p: { useManual?: string }) {
  const input = buildInput(p.useManual || formatDateTimeLocalSeconds(new Date()))
  finish(runMeihuaSecondTime(input, store.settings.useShenshaInScore))
}
function onRandom(p: { numbers: [number, number, number] }) {
  const input = buildInput('')
  finish(runMeihuaRandom(input, p.numbers, store.settings.useShenshaInScore))
}
function onDice(p: { upperD8: number; lowerD8: number; movingD6: number }) {
  const input = buildInput('')
  finish(runMeihuaDice(input, p.upperD8, p.lowerD8, p.movingD6, store.settings.useShenshaInScore))
}
function onCoins(p: { lines: number[]; movingMask: boolean[]; throws: any[] }) {
  const input = buildInput('')
  finish(runLiuyao(input, p.lines, p.movingMask, store.settings.useShenshaInScore, p.throws))
}
function onText(p: { text: string }) {
  const input = buildInput('')
  finish(runMeihuaText(input, p.text, store.settings.useShenshaInScore))
}
function onOmen(p: { kind: 'color' | 'symbol'; value: string; direction: string }) {
  const input = buildInput('')
  finish(runMeihuaOmen(input, p, store.settings.useShenshaInScore))
}
function onSixSource(p: { payload: SixSourcePayload }) {
  const input = buildInput(p.payload.exactTime)
  finish(runSixSourceHybrid(input, p.payload, store.settings.useShenshaInScore))
}
</script>

<style scoped>
.method-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px }
.method-card { position:relative; text-align:left; padding:12px; border:1px solid var(--line); border-radius:12px; background:var(--card); color:var(--text) }
.method-card.on { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent) }
.m-icon { font-size:22px }
.m-name { font-weight:600; margin:4px 0 }
.m-desc { font-size:12px; color:var(--muted) }
.badge { position:absolute; top:8px; right:8px; font-size:10px; padding:2px 6px; border-radius:8px }
.badge.warn { background:#c0392b; color:#fff }
.badge.info { background:#2980b9; color:#fff }
.badge.ok { background:#27ae60; color:#fff }
</style>

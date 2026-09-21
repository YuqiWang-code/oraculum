<template>
  <div>
    <Stepper :steps="['准备问题', '起卦', '生成卦象', '解读']" :current="step" />

    <!-- ============ 第一步：准备问题 ============ -->
    <div v-show="step === 0">
      <div class="card">
        <span class="layer-tag">第一步</span>
        <h1 style="margin:2px 0 6px">今天想了解什么？</h1>
        <p class="lead">先在心里把问题想得具体一点，比如「这份工作机会该不该接」。</p>

        <div class="theme-grid" style="margin:14px 0">
          <button
            v-for="t in themes"
            :key="t.key"
            type="button"
            :class="['theme-card', category === t.category && t.key !== 'surprise' ? 'on' : '']"
            @click="category = t.category"
          >
            <div class="t-icon">{{ t.icon }}</div>
            <div class="t-title">{{ t.title }}</div>
            <div class="t-sub">{{ t.subtitle }}</div>
          </button>
        </div>

        <label>把你的问题写下来</label>
        <textarea v-model="question" rows="3" placeholder="例如：这份工作机会该不该接？"></textarea>

        <details class="guofeng" style="margin:10px 0">
          <summary>🎲 没头绪？用灵感转盘挑个方向</summary>
          <div class="details-body">
            <InspirationWheel @pick="onWheelPick" />
          </div>
        </details>

        <details class="guofeng" style="margin:10px 0">
          <summary>更多问题类型 / 代号（可不填）</summary>
          <div class="details-body">
            <label>问题类别（专业分类）</label>
            <select v-model="category">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
            <label>姓名/代号（可选，仅记录用）</label>
            <input v-model="alias" placeholder="不参与起卦，只用于记录与称呼" />
            <label>性别（可选，默认不参与起卦）</label>
            <select v-model="gender">
              <option value="unspecified">不指定</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </details>

        <button class="btn cinnabar" @click="goCast">开始问卦</button>
        <p class="muted" style="text-align:center">姓名、性别不参与数学起卦；所有计算只在本机进行。</p>
      </div>
    </div>

    <!-- ============ 第二步：起卦 ============ -->
    <div v-show="step === 1">
      <button class="btn secondary small" style="margin:10px 12px 0" @click="step = 0">← 返回修改问题</button>

      <div class="card" style="background:var(--paper-2)">
        <div class="muted">你问的是</div>
        <div style="font-size:16px;font-weight:600;margin:2px 0 4px">{{ question }}</div>
        <div class="tag">{{ category }}</div>
      </div>

      <!-- 默认：三枚钱六爻 -->
      <CoinCaster v-if="mode === 'liuyao_coins'" @confirm="onCoins" />

      <!-- 其它传统 / 现代方式，折叠在后面，供研究用户使用 -->
      <details class="guofeng">
        <summary>换一种传统方式起卦（梅花、时间、字数等）</summary>
        <div class="details-body">
          <fieldset v-for="g in groups" :key="g.title" class="method-group">
            <legend>{{ g.title }}</legend>
            <div class="method-grid">
              <button
                v-for="m in g.items"
                :key="m.key"
                type="button"
                :class="['method-card', mode === m.key ? 'on' : '']"
                @click="mode = m.key"
              >
                <div class="m-icon">{{ m.icon }}</div>
                <div class="m-name">{{ m.name }}</div>
                <div class="m-desc">{{ m.desc }}</div>
                <span :class="['badge', m.tier]">{{ m.badge }}</span>
              </button>
            </div>
          </fieldset>

          <div v-if="mode === 'meihua_time'" class="card" style="margin:8px 0">
            <h2>梅花 · 年月日时 <span class="tag">传统</span></h2>
            <div class="muted">以农历年支、月、日、时支起卦。</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
              <button class="btn" @click="onMeihuaTime('')">用当前时间起卦</button>
              <div class="muted">或手工指定：</div>
              <input type="datetime-local" v-model="manualTime" />
              <button class="btn secondary" @click="onMeihuaTime(manualTime)">按指定时间起卦</button>
            </div>
          </div>
          <TimeSecondCaster v-else-if="mode === 'meihua_time_second'" @confirm="onSecondTime" />
          <RandomCaster v-else-if="mode === 'meihua_random'" @confirm="onRandom" />
          <DiceCaster v-else-if="mode === 'meihua_dice'" @confirm="onDice" />
          <TextCaster v-else-if="mode === 'meihua_text'" :default-text="question" @confirm="onText" />
          <OmenCaster v-else-if="mode === 'meihua_external_omen'" @confirm="onOmen" />
          <SixSourceWizard v-else-if="mode === 'six_source_hybrid'" @confirm="onSixSource" />
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'DivinationView' }
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { QUESTION_CATEGORIES } from '../engine/interpretation/classifyQuestion'
import {
  runMeihuaTime, runMeihuaSecondTime, runMeihuaRandom, runMeihuaDice,
  runMeihuaText, runMeihuaOmen, runSixSourceHybrid, runLiuyao
} from '../engine/orchestrator'
import { saveRecord } from '../db'
import { formatDateTimeLocalSeconds, parseLocalDateTime } from '../utils/datetime'
import { FRIENDLY_THEMES } from '../local-data/plainInterpretation'
import type { WheelSector } from '../local-data/plainInterpretation'
import type { QuestionCategory, Gender, CastingMode } from '../types'
import type { SixSourcePayload } from '../types'
import Stepper from '../components/common/Stepper.vue'
import InspirationWheel from '../components/casting/InspirationWheel.vue'
import TimeSecondCaster from '../components/casting/TimeSecondCaster.vue'
import RandomCaster from '../components/casting/RandomCaster.vue'
import DiceCaster from '../components/casting/DiceCaster.vue'
import CoinCaster from '../components/casting/CoinCaster.vue'
import TextCaster from '../components/casting/TextCaster.vue'
import OmenCaster from '../components/casting/OmenCaster.vue'
import SixSourceWizard from '../components/casting/SixSourceWizard.vue'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const step = ref<0 | 1>(0)
const question = ref('')
const initialCategory = route.query.category as QuestionCategory | undefined
const category = ref<QuestionCategory>(
  initialCategory && QUESTION_CATEGORIES.includes(initialCategory) ? initialCategory : '日常综合'
)
const alias = ref('')
const gender = ref<Gender>('unspecified')
const mode = ref<CastingMode | 'liuyao_coins'>('liuyao_coins')
const manualTime = ref(formatDateTimeLocalSeconds(new Date()))
const categories = QUESTION_CATEGORIES
const themes = FRIENDLY_THEMES

interface MethodItem {
  key: CastingMode
  name: string
  desc: string
  badge: string
  tier: 'warn' | 'info' | 'ok'
  icon: string
}

const groups: { title: string; items: MethodItem[] }[] = [
  {
    title: '传统 / 常用',
    items: [
      { key: 'meihua_time', name: '梅花年月日时', desc: '农历年月日时起卦', badge: '传统', tier: 'ok', icon: '☰' },
      { key: 'meihua_text', name: '传统思想·字数', desc: '按所问字数起卦', badge: '传统', tier: 'ok', icon: '✍' },
      { key: 'meihua_external_omen', name: '外应', desc: '见象/色/方位', badge: '传统+规范', tier: 'ok', icon: '👁' }
    ]
  },
  {
    title: '现代数字化',
    items: [
      { key: 'meihua_time_second', name: '秒级时间', desc: '精确到秒参与算法', badge: '现代扩展', tier: 'info', icon: '⏱' },
      { key: 'meihua_random', name: '随机数', desc: '安全随机取数', badge: '现代数字化', tier: 'info', icon: '🎲' },
      { key: 'meihua_dice', name: '骰子', desc: 'd8×2 + d6', badge: '现代交互', tier: 'info', icon: '⚂' }
    ]
  },
  {
    title: '实验',
    items: [
      { key: 'six_source_hybrid', name: '六源合参', desc: '六点合一，实验模式', badge: '实验', tier: 'warn', icon: '☯' }
    ]
  }
]

function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

function buildInput(castTimeLocal: string) {
  const d = castTimeLocal ? parseLocalDateTime(castTimeLocal) : new Date()
  return {
    id: id(),
    createdAt: new Date().toISOString(),
    timezone: store.settings.timezone || 'Asia/Shanghai',
    dayBoundaryRule: store.settings.dayBoundaryRule || 'midnight',
    question: question.value.trim(),
    category: category.value,
    querentAlias: alias.value || undefined,
    gender: gender.value,
    castingMode: mode.value as CastingMode,
    castTime: d.toISOString()
  }
}

function goCast() {
  if (!question.value.trim()) {
    alert('先写下你想问的事情，哪怕一句话也行。')
    return
  }
  step.value = 1
}

function onWheelPick(s: WheelSector) {
  category.value = s.category
  if (!question.value.trim()) question.value = s.placeholder
}

async function finish(rec: Awaited<ReturnType<typeof runMeihuaTime>>) {
  if (!question.value.trim()) { alert('请输入所问之事'); return }
  store.lastResult = rec
  await saveRecord(rec)
  router.push('/result/' + rec.id)
}

function onMeihuaTime(useManual: string) {
  const input = buildInput(useManual || formatDateTimeLocalSeconds(new Date()))
  finish(runMeihuaTime(input, store.settings.useShenshaInScore))
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
  try {
    const input = buildInput('')
    const rec = runLiuyao(input, p.lines, p.movingMask, store.settings.useShenshaInScore, p.throws)
    finish(rec)
  } catch (e: any) {
    console.error('六爻起卦失败:', e)
    alert('起卦出错：' + (e?.message || e))
  }
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
.method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px; }
.method-group { border: 1px solid var(--line); border-radius: 12px; margin: 0 0 12px; padding: 10px 12px 14px; }
.method-group legend { font-size: 13px; color: var(--muted); padding: 0 6px; }
.method-card { position: relative; text-align: left; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: var(--text); }
.method-card.on { border-color: var(--cinnabar); box-shadow: 0 0 0 1px var(--cinnabar); }
.m-icon { font-size: 22px; }
.m-name { font-weight: 600; margin: 4px 0; }
.m-desc { font-size: 12px; color: var(--muted); }
.badge { position: absolute; top: 8px; right: 8px; font-size: 10px; padding: 2px 6px; border-radius: 8px; }
.badge.warn { background: var(--cinnabar); color: #fff; }
.badge.info { background: var(--celadon); color: #fff; }
.badge.ok { background: var(--gold); color: #fff; }
</style>

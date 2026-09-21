<template>
  <div class="card">
    <h2>卦象变化研究 <TermHelp term="十六变" depth="research" /></h2>
    <p class="plain-intro">
      古人认为事情会不断变化。这里展示<strong>一个卦是怎么一步步变化的</strong>，
      看的是卦本身的结构，<strong>不是预测你的人生年份</strong>，也不对应寿命、祸福。
    </p>
    <details class="guofeng" style="margin:8px 0">
      <summary>什么是八宫、游魂、归魂？</summary>
      <div class="details-body">
        <p class="muted" style="line-height:1.9">
          古人把六十四卦分成八个「家族」（<TermHelp term="八宫" depth="research" />）。
          一个卦在家族里按规则逐爻变化，会经过<TermHelp term="游魂" depth="research" />、
          <TermHelp term="归魂" depth="research" />等阶段，最后回到本位。这是一套研究「变化规律」的结构图，
          属于传统卦变研究，仅供文化参考。
        </p>
      </div>
    </details>
    <p class="muted" style="margin-top:0">
      研究层：先选一个"本命卦来源"，再展示该宫的十六变结构。这里是卦变结构研究，不把十六变自动映射到年龄。
    </p>

    <!-- 来源选择 -->
    <div class="src-group">
      <label class="src-opt">
        <input type="radio" value="a" v-model="sourceMode" class="src-input" />
        <span>
          <strong>A. 身命卦研究模式（本机历史问卦）</strong>
          <span class="muted sub">
            从本机历史问卦记录中选一条，读取它的卦与所属宫；
            <em>不会自动用最近一次</em>，必须由你点"以此作为研究身命卦"才进入十六变。
          </span>
        </span>
      </label>

      <!-- Source A 记录列表 -->
      <div v-if="sourceMode === 'a'" class="a-panel">
        <button class="btn small" @click="loadHistory">加载本机历史记录</button>
        <div v-if="historyError" class="muted warn-inline">{{ historyError }}</div>
        <div v-if="historyRecords.length" class="a-list">
          <div
            v-for="r in historyRecords" :key="r.id"
            :class="['a-item', selectedHistoryId === r.id ? 'sel' : '']"
            @click="selectedHistoryId = r.id"
          >
            <div class="a-q">{{ r.question || '（无问题）' }}</div>
            <div class="muted a-meta">{{ formatTime(r.createdAt) }} · 卦：{{ r.hexagramName || '未知' }} · 宫：{{ recordPalace(r) || '未知' }}</div>
          </div>
        </div>
        <p v-else-if="!historyLoaded" class="muted tip">点击上方按钮加载历史问卦记录。</p>
        <button
          class="btn" :disabled="!selectedHistoryPalace"
          @click="runFromHistory"
        >以此作为研究身命卦</button>
      </div>

      <label class="src-opt" :class="{ disabled: !canUseTime }">
        <input type="radio" value="b" v-model="sourceMode" class="src-input" :disabled="!canUseTime" />
        <span>
          <strong>B. 出生时刻起卦（meihua_time_v1）</strong>
          <span class="muted sub">
            用出生年月日时按梅花易数时间起卦，再归宫。
            <em class="warn-inline">Oraculum 项目规范 / 实验，不是《京氏易传》明确记载的出生本命卦算法。</em>
          </span>
        </span>
      </label>
      <p v-if="!canUseTime" class="muted tip">
        需要先在上方用完整出生年月日时（精确到时辰）计算；缺日或缺时辰时不能用 B。
      </p>

      <label class="src-opt">
        <input type="radio" value="c" v-model="sourceMode" class="src-input" />
        <span>
          <strong>C. 手动选宫</strong>
          <span class="muted sub">直接选择八宫之一，以该宫本宫卦为基准做十六变。</span>
        </span>
      </label>
      <div v-if="sourceMode === 'c'" class="c-row">
        <select v-model="selectedPalace">
          <option v-for="p in PALACES" :key="p" :value="p">{{ p }}宫</option>
        </select>
      </div>
    </div>

    <!-- 来源链（Source B / Source A） -->
    <div v-if="sourceChain" class="source-note">
      <h3>来源链</h3>
      <div class="chain-row"><span class="chain-label">起得卦</span><strong>{{ sourceChain.hexagramName }}</strong></div>
      <div class="chain-row"><span class="chain-label">所属宫</span><strong>{{ sourceChain.palace }}宫</strong></div>
      <div class="chain-row"><span class="chain-label">十六变基准</span><strong>{{ sourceChain.palace }}宫纯卦</strong></div>
      <div v-if="sourceChain.kind === 'b'" class="muted note-box">
        本结果由"出生时刻时间起卦"实验而来。<em class="warn-inline">这是 Oraculum 项目规范 / 实验，不是《京氏易传》明确记载的出生本命卦算法。</em>
      </div>
    </div>

    <!-- 来源说明 -->
    <div v-if="result" class="source-note">
      <h3>基准卦</h3>
      <div class="base-row">
        <span class="base-name">{{ result.baseName }}</span>
        <span class="muted">宫位基准</span>
      </div>
      <div class="muted note-box">{{ SIXTEEN_TRANSFORM_SOURCE_NOTE }}</div>
      <div class="muted note-box">{{ NO_AGE_MAPPING_NOTE }}</div>
    </div>

    <!-- 十六变序列（默认折叠） -->
    <div v-if="readings.length" class="steps">
      <div
        v-for="r in readings" :key="r.index"
        class="step"
        :class="{ open: openSteps.has(r.index), historic: isHistoric(stageName(r.index)) }"
      >
        <div class="step-head" @click="toggleStep(r.index)">
          <span class="step-index">{{ r.index }}</span>
          <span class="step-name">{{ stageName(r.index) }}</span>
          <span class="step-hex">{{ stepHexagram(r.index) }}</span>
          <span class="step-trans">{{ r.transition }}</span>
          <span class="layer-tag">{{ layerLabel(stepLayer(r.index)) }}</span>
          <span class="toggle">{{ openSteps.has(r.index) ? '收起' : '展开' }}</span>
        </div>
        <div v-if="openSteps.has(r.index)" class="step-body">
          <div class="sb-row"><span class="sb-label">本次翻动</span>{{ r.flippedLine > 0 ? `第${r.flippedLine}爻` : '无' }}</div>
          <div class="sb-row"><span class="sb-label">结构变化</span>{{ r.structuralChange }}</div>
          <div class="sb-row"><span class="sb-label">阶段意思</span>{{ r.stageMeaning }}</div>
          <div class="sb-row"><span class="sb-label">卦意思</span>{{ r.hexagramMeaning }}</div>
          <div class="sb-row"><span class="sb-label">来源层</span>{{ layerLabel(r.sourceNote) }}</div>
          <div v-if="isHistoric(stageName(r.index))" class="historic-warn">
            {{ HISTORICAL_TERM_DISCLAIMER }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="result && !result.returnsToBase" class="muted warn-inline">
      警告：变换后未回到本宫，请检查数据。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TermHelp from '../common/TermHelp.vue'
import type { BirthProfile, SixteenTransformResult, JingFangStepReading } from '../../engine/fortune'
import {
  transformSixteen,
  getPalaceBaseLines,
  HISTORICAL_TERM_DISCLAIMER,
  HISTORICAL_TERMS,
  SIXTEEN_TRANSFORM_SOURCE_NOTE,
  NO_AGE_MAPPING_NOTE,
  SOURCE_LAYER_NOTES,
  buildStepReadings,
  SIXTEEN_STAGES
} from '../../engine/fortune'
import { normalizeBirthProfile } from '../../engine/fortune'
import { buildCalendarContext } from '../../engine/calendar/calendarEngine'
import { castMeihuaByTime } from '../../engine/meihua/castByTime'
import { listHistory } from '../../db'
import type { HistoryRecord } from '../../db/schema'

const props = defineProps<{ profile: BirthProfile | null }>()

const PALACES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const

const sourceMode = ref<'none' | 'a' | 'b' | 'c'>('none')
const selectedPalace = ref<string>('乾')
const result = ref<SixteenTransformResult | null>(null)
const readings = ref<JingFangStepReading[]>([])
const openSteps = ref<Set<number>>(new Set())

interface SourceChain {
  kind: 'a' | 'b'
  hexagramName: string
  palace: string
}
const sourceChain = ref<SourceChain | null>(null)

/** Source A 历史记录 */
const historyRecords = ref<HistoryRecord[]>([])
const historyLoaded = ref(false)
const historyError = ref('')
const selectedHistoryId = ref<string>('')

const canUseTime = computed(
  () => !!props.profile && props.profile.precision === 'exact_time'
)

function wallClockToInstant(
  y: number, m: number, d: number, h: number, min: number, tz: string
): Date {
  const utcGuess = Date.UTC(y, m - 1, d, h, min, 0)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
  const parts = dtf.formatToParts(new Date(utcGuess))
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value, 10)
  const wallMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), 0)
  const offset = wallMs - utcGuess
  return new Date(utcGuess - offset)
}

function runFromBase(palace: string, hexagramName: string, kind: 'a' | 'b') {
  const lines = getPalaceBaseLines(palace)
  if (!lines) return
  result.value = transformSixteen(lines)
  readings.value = buildStepReadings(result.value)
  openSteps.value = new Set([0])
  sourceChain.value = { kind, hexagramName, palace }
}

function stageName(index: number): string {
  return SIXTEEN_STAGES[index]?.name ?? ''
}
function stepHexagram(index: number): string {
  return readings.value[index] ? readings.value[index].transition.split(' → ').pop() ?? '' : ''
}
function stepLayer(index: number): string {
  return SIXTEEN_STAGES[index]?.sourceLayer ?? ''
}

/** Source B */
function computeSourceB() {
  result.value = null
  readings.value = []
  sourceChain.value = null
  const p = props.profile
  if (!p) return
  try {
    // 复用统一 normalize helper
    const norm = normalizeBirthProfile(p)
    const { year, month, day } = norm.wallClock
    const h = p.hour ?? 0
    const min = p.minute ?? 0
    const instant = wallClockToInstant(year, month, day ?? 1, h, min, p.timezone)
    const cal = buildCalendarContext({ date: instant, timezone: p.timezone, dayBoundaryRule: 'midnight' })
    const mh = castMeihuaByTime(cal)
    const palace = mh.ben.palace
    runFromBase(palace, mh.ben.name, 'b')
  } catch {
    result.value = null
    readings.value = []
  }
}

/** Source A：加载历史 */
async function loadHistory() {
  historyError.value = ''
  try {
    historyRecords.value = await listHistory(50)
    historyLoaded.value = true
  } catch (e) {
    historyError.value = e instanceof Error ? e.message : String(e)
  }
}

function recordPalace(r: HistoryRecord): string {
  // 六爻优先，其次梅花
  const liuYaoPalace = (r as unknown as { liuyao?: { palace?: string } }).liuyao?.palace
  if (liuYaoPalace) return liuYaoPalace
  const meiHuaBen = (r as unknown as { meihua?: { ben?: { palace?: string } } }).meihua?.ben?.palace
  return meiHuaBen ?? ''
}

const selectedHistoryPalace = computed(() => {
  const r = historyRecords.value.find((x) => x.id === selectedHistoryId.value)
  if (!r) return ''
  return recordPalace(r)
})

function runFromHistory() {
  const r = historyRecords.value.find((x) => x.id === selectedHistoryId.value)
  if (!r) return
  const palace = recordPalace(r)
  if (!palace) {
    historyError.value = '该记录没有可用的宫位信息。'
    return
  }
  runFromBase(palace, r.hexagramName || palace, 'a')
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return iso
  }
}

function toggleStep(index: number) {
  const next = new Set(openSteps.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  openSteps.value = next
}

function isHistoric(name: string): boolean {
  return HISTORICAL_TERMS.includes(name)
}

function layerLabel(layer: string): string {
  return SOURCE_LAYER_NOTES[layer]?.label ?? layer
}

watch(sourceMode, (mode) => {
  result.value = null
  readings.value = []
  sourceChain.value = null
  if (mode === 'b') computeSourceB()
  else if (mode === 'c') {
    // 手动选宫：立即用当前选中的宫计算
    const lines = getPalaceBaseLines(selectedPalace.value)
    if (lines) {
      result.value = transformSixteen(lines)
      readings.value = buildStepReadings(result.value)
      openSteps.value = new Set([0])
    }
  }
})

watch(selectedPalace, () => {
  if (sourceMode.value === 'c') {
    const lines = getPalaceBaseLines(selectedPalace.value)
    if (lines) {
      result.value = transformSixteen(lines)
      readings.value = buildStepReadings(result.value)
      openSteps.value = new Set([0])
    }
  }
})
</script>

<style scoped>
.plain-intro {
  font-size: 15.5px; line-height: 1.85; color: var(--ink-soft);
  background: var(--paper-2); border-left: 3px solid var(--cinnabar);
  padding: 10px 12px; border-radius: 0 10px 10px 0; margin: 8px 0;
}
.src-group { margin: 10px 0; }
.src-opt {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  background: var(--bg);
  font-size: 16px;
}
.src-opt.disabled { opacity: 0.6; cursor: not-allowed; }
.src-input { width: auto; margin: 4px 0 0; flex: 0 0 auto; }
.src-opt .sub { display: block; font-size: 13px; line-height: 1.6; margin-top: 2px; }
.tip { margin: -4px 0 8px; }
.warn-inline { color: var(--bad); font-style: normal; }
.c-row { margin: 4px 0 8px; }
.a-panel { margin: 0 0 8px; padding: 8px; border: 1px dashed var(--line); border-radius: 10px; }
.a-list { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; max-height: 240px; overflow-y: auto; }
.a-item {
  padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px;
  cursor: pointer; background: var(--bg);
}
.a-item.sel { border-color: var(--accent); }
.a-q { font-size: 15px; }
.a-meta { font-size: 12px; margin-top: 2px; }

.source-note { margin: 12px 0; }
.source-note h3 { margin: 0 0 6px; font-size: 16px; }
.chain-row { display: flex; gap: 10px; padding: 3px 0; font-size: 15px; }
.chain-label { display: inline-block; min-width: 5em; color: var(--muted); }
.base-row {
  display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px;
}
.base-name { font-size: 20px; font-weight: 700; color: var(--accent); }
.note-box {
  padding: 8px 10px;
  border-left: 3px solid var(--line);
  margin: 6px 0;
  line-height: 1.7;
}
.steps { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.step {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
}
.step.historic { border-color: var(--flat); }
.step-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 8px 10px; cursor: pointer;
}
.step-index {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); color: var(--bg); font-size: 12px;
}
.step-name { font-size: 16px; font-weight: 700; }
.step-hex { font-size: 15px; color: var(--accent); }
.step-trans { font-size: 13px; color: var(--muted); }
.layer-tag {
  font-size: 11px;
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
}
.toggle { margin-left: auto; font-size: 12px; color: var(--accent); }
.step-body { padding: 4px 10px 10px; border-top: 1px dashed var(--line); }
.sb-row { font-size: 14px; line-height: 1.7; padding: 2px 0; }
.sb-label { display: inline-block; min-width: 5em; color: var(--muted); }
.historic-warn {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(138, 122, 58, 0.12);
  color: var(--flat);
  font-size: 13px;
  line-height: 1.6;
}
.btn.small { font-size: 14px; padding: 5px 10px; }
</style>

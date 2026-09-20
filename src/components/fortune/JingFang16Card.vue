<template>
  <div class="card">
    <h2>京房八宫 / 《易隐》十六变</h2>
    <p class="muted" style="margin-top:0">
      研究层：先选一个"本命卦来源"，再展示该宫的十六变结构。这里是卦变结构研究，不把十六变自动映射到年龄。
    </p>

    <!-- 来源选择 -->
    <div class="src-group">
      <label class="src-opt" :class="{ disabled: false }">
        <input type="radio" value="a" v-model="sourceMode" class="src-input" />
        <span>
          <strong>A. 身命卦研究模式</strong>
          <span class="muted sub">复用现有问卦起卦方式得到一卦，再识别它属于哪一宫。本卡片不自动起卦；请到"问卦"页起卦后，记下所得卦象，再在 C 中手动选宫。</span>
        </span>
      </label>

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

    <!-- 十六变序列 -->
    <div v-if="result" class="steps">
      <div
        v-for="(s, i) in result.steps" :key="i"
        class="step"
        :class="{ historic: isHistoric(s.stage.name) }"
      >
        <div class="step-head">
          <span class="step-index">{{ s.stage.index }}</span>
          <span class="step-name">{{ s.stage.name }}</span>
          <span class="step-hex">{{ s.hexagramName }}</span>
          <span class="layer-tag">{{ layerLabel(s.stage.sourceLayer) }}</span>
        </div>
        <div class="step-note">{{ s.stage.modernNote }}</div>
        <div v-if="isHistoric(s.stage.name)" class="historic-warn">
          {{ HISTORICAL_TERM_DISCLAIMER }}
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
import { Lunar } from 'lunar-javascript'
import type { BirthProfile, SixteenTransformResult } from '../../engine/fortune'
import {
  transformSixteen,
  getPalaceBaseLines,
  HISTORICAL_TERM_DISCLAIMER,
  HISTORICAL_TERMS,
  SIXTEEN_TRANSFORM_SOURCE_NOTE,
  NO_AGE_MAPPING_NOTE,
  SOURCE_LAYER_NOTES
} from '../../engine/fortune'
import { buildCalendarContext } from '../../engine/calendar/calendarEngine'
import { castMeihuaByTime } from '../../engine/meihua/castByTime'

const props = defineProps<{ profile: BirthProfile | null }>()

const PALACES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const

const sourceMode = ref<'none' | 'a' | 'b' | 'c'>('none')
const selectedPalace = ref<string>('乾')
const result = ref<SixteenTransformResult | null>(null)

const canUseTime = computed(
  () => !!props.profile && props.profile.precision === 'exact_time'
)

/** 把"某时区墙上时钟"转成对应 UTC instant，供 buildCalendarContext 还原墙上时间。 */
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

function runFromBase(baseLines: [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]) {
  result.value = transformSixteen(baseLines)
}

function computeForSource() {
  result.value = null
  if (sourceMode.value === 'c') {
    const lines = getPalaceBaseLines(selectedPalace.value)
    if (lines) runFromBase(lines)
    return
  }
  if (sourceMode.value === 'b' && canUseTime.value && props.profile) {
    const p = props.profile
    let y = p.year, m = p.month, d = p.day ?? 1
    // 农历转公历（日期部分）
    if (p.calendarType === 'lunar') {
      try {
        const lunar = Lunar.fromYmd(y, m, d)
        const solar = lunar.getSolar()
        y = solar.getYear(); m = solar.getMonth(); d = solar.getDay()
      } catch {
        // 转换失败则放弃 B
        return
      }
    }
    const h = p.hour ?? 0
    const min = p.minute ?? 0
    try {
      const instant = wallClockToInstant(y, m, d, h, min, p.timezone)
      const cal = buildCalendarContext({ date: instant, timezone: p.timezone, dayBoundaryRule: 'midnight' })
      const mh = castMeihuaByTime(cal)
      const lines = getPalaceBaseLines(mh.ben.palace)
      if (lines) runFromBase(lines)
    } catch {
      result.value = null
    }
    return
  }
  // A：仅提示，不自动计算
  result.value = null
}

watch([sourceMode, selectedPalace], computeForSource)

function isHistoric(name: string): boolean {
  return HISTORICAL_TERMS.includes(name)
}

function layerLabel(layer: string): string {
  return SOURCE_LAYER_NOTES[layer]?.label ?? layer
}
</script>

<style scoped>
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
.source-note { margin: 12px 0; }
.source-note h3 { margin: 0 0 6px; font-size: 16px; }
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
.steps { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.step {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--bg);
}
.step.historic { border-color: var(--flat); }
.step-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.step-index {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); color: var(--bg); font-size: 12px;
}
.step-name { font-size: 16px; font-weight: 700; }
.step-hex { font-size: 15px; color: var(--accent); }
.layer-tag {
  margin-left: auto;
  font-size: 11px;
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
}
.step-note { font-size: 15px; line-height: 1.7; margin-top: 4px; }
.historic-warn {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(138, 122, 58, 0.12);
  color: var(--flat);
  font-size: 13px;
  line-height: 1.6;
}
</style>

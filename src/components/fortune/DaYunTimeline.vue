<template>
  <div class="card" v-if="entries.length">
    <div class="head-row">
      <h2 style="margin:0">人生阶段时间轴 <TermHelp term="大运" /></h2>
    </div>
    <p class="muted" style="margin:4px 0 0">
      传统把人生按大约十年分成一段一段，下面标出常见的人生阶段；干支是传统记号，看不懂可以只看年龄和说明。
    </p>

    <!-- 年龄范围切换 -->
    <div class="range-row">
      <span class="muted">展示到</span>
      <div class="segmented">
        <button
          v-for="r in ranges" :key="r" type="button"
          :class="['seg-btn', maxAge === r ? 'active' : '']"
          @click="maxAge = r"
        >{{ r }}岁</button>
      </div>
    </div>

    <!-- 横向时间轴 -->
    <div class="track">
      <div
        v-for="e in visible" :key="e.index"
        :class="['dy-node', expanded === e.index ? 'open' : '', isCurrent(e) ? 'now' : '']"
        @click="toggle(e.index)"
      >
        <div class="dot"></div>
        <div class="dy-stage">{{ stageName(e.startAge) }}</div>
        <div class="dy-age">{{ e.startAge }}-{{ e.endAge }}岁</div>
        <div class="dy-gz">{{ e.ganzhi }}</div>
      </div>
    </div>

    <!-- 展开详情 -->
    <div v-if="expandedEntry" class="detail">
      <h3>{{ stageName(expandedEntry.startAge) }}（{{ expandedEntry.startAge }}-{{ expandedEntry.endAge }}岁）</h3>
      <div class="d-row"><span>传统干支 <TermHelp term="天干地支" depth="research" /></span><strong>{{ expandedEntry.ganzhi }}（{{ expandedEntry.direction }}排）</strong></div>
      <div v-if="expandedEntry.startDate" class="d-row"><span>起运公历 <TermHelp term="起运" depth="research" /></span><strong>{{ expandedEntry.startDate }}</strong></div>

      <div v-if="analysisFor(expandedEntry.index)" class="reading">
        <div class="rd-row" v-if="analysisFor(expandedEntry.index)!.stemTenGod">
          <span><TermHelp term="十神" depth="research" /></span><strong>{{ analysisFor(expandedEntry.index)!.stemTenGod }}</strong>
        </div>
        <div v-if="analysisFor(expandedEntry.index)!.evidence.length" class="ev-list">
          <div v-for="ev in analysisFor(expandedEntry.index)!.evidence" :key="ev.id" class="ev-item">
            {{ ev.detail }}
          </div>
        </div>
        <div class="rd-block">
          <div class="rd-label">值得关注</div>
          <div>{{ analysisFor(expandedEntry.index)!.reading.focus }}</div>
          <div class="rd-label">为什么</div>
          <div>{{ analysisFor(expandedEntry.index)!.reading.why }}</div>
          <div class="rd-label">适合怎么做</div>
          <div>{{ analysisFor(expandedEntry.index)!.reading.howToAct }}</div>
          <div class="rd-label">注意</div>
          <div>{{ analysisFor(expandedEntry.index)!.reading.watchOut }}</div>
        </div>
      </div>

      <div class="muted" style="margin-top:6px">
        每一步约十年，是传统文化观察人生阶段的一种方法，属于粗分参考，不是对具体事件的预测。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TermHelp from '../common/TermHelp.vue'
import type { DaYunEntry, DaYunAnalysis } from '../../engine/fortune'

const props = defineProps<{
  entries: DaYunEntry[]
  analyses?: DaYunAnalysis[]
}>()

const ranges = [80, 90, 100, 120] as const
const maxAge = ref<number>(100)
const expanded = ref<number | null>(null)

/** 按起始年龄给一个现代人生阶段俗称 */
function stageName(startAge: number): string {
  if (startAge <= 12) return '童年'
  if (startAge <= 18) return '少年'
  if (startAge <= 25) return '青年'
  if (startAge <= 35) return '而立'
  if (startAge <= 50) return '中年'
  if (startAge <= 64) return '壮年'
  return '晚年'
}

/** 当前公历时间是否落在该阶段（依据起运公历区间） */
function isCurrent(e: DaYunEntry): boolean {
  if (!e.startDate) return false
  const nowYear = new Date().getFullYear()
  const startYear = new Date(e.startDate).getFullYear()
  const span = e.endAge - e.startAge + 1
  return nowYear >= startYear && nowYear <= startYear + span
}

const visible = computed(() =>
  props.entries.filter((e) => e.startAge <= maxAge.value)
)

const expandedEntry = computed(() =>
  props.entries.find((e) => e.index === expanded.value) ?? null
)

function analysisFor(index: number): DaYunAnalysis | undefined {
  return props.analyses?.find((a) => a.entry.index === index)
}

function toggle(index: number) {
  expanded.value = expanded.value === index ? null : index
}
</script>

<style scoped>
.head-row { display: flex; justify-content: space-between; align-items: center; }
.range-row {
  display: flex; align-items: center; gap: 10px; margin: 10px 0;
  flex-wrap: wrap;
}
.segmented {
  display: inline-flex; border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
}
.seg-btn {
  border: none; background: transparent; color: var(--text);
  padding: 6px 10px; font-size: 14px; cursor: pointer;
}
.seg-btn.active { background: var(--accent); color: var(--bg); }

.track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 14px 4px 10px;
  -webkit-overflow-scrolling: touch;
}
.dy-node {
  flex: 0 0 78px;
  text-align: center;
  cursor: pointer;
  padding: 8px 4px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper-2, var(--bg));
  position: relative;
}
.dy-node.open { border-color: var(--cinnabar); background: var(--card); }
.dy-node.now { border-color: var(--cinnabar); box-shadow: 0 0 0 1.5px var(--cinnabar); }
.dot {
  width: 10px; height: 10px; border-radius: 50%;
  margin: 0 auto 6px;
  background: var(--muted);
}
.dy-node.now .dot { background: var(--cinnabar); }
.dy-stage { font-size: 14px; font-weight: 700; color: var(--ink); }
.dy-age { font-size: 12px; color: var(--muted); margin-top: 2px; }
.dy-gz { font-size: 12px; color: var(--muted); margin-top: 1px; opacity: 0.75; }

.detail {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
}
.detail h3 { margin: 0 0 6px; font-size: 16px; }
.d-row {
  display: flex; justify-content: space-between;
  padding: 4px 0; font-size: 15px;
}
.d-row span { color: var(--muted); }
.ev-list { margin: 6px 0; }
.ev-item {
  font-size: 14px; color: var(--muted);
  padding: 2px 0; line-height: 1.6;
}
.rd-block { margin-top: 8px; font-size: 15px; line-height: 1.7; }
.rd-label {
  color: var(--muted); font-size: 13px;
  margin-top: 6px;
}
</style>

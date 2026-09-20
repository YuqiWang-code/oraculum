<template>
  <div class="card" v-if="entries.length">
    <div class="head-row">
      <h2 style="margin:0">大运时间轴</h2>
    </div>

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
        :class="['dy-node', expanded === e.index ? 'open' : '']"
        @click="toggle(e.index)"
      >
        <div class="dot"></div>
        <div class="dy-gz">{{ e.ganzhi }}</div>
        <div class="dy-age">{{ e.startAge }}-{{ e.endAge }}</div>
      </div>
    </div>

    <!-- 展开详情 -->
    <div v-if="expandedEntry" class="detail">
      <h3>{{ expandedEntry.ganzhi }} 大运（{{ expandedEntry.direction }}排）</h3>
      <div class="d-row"><span>起止年龄</span><strong>{{ expandedEntry.startAge }} 岁 至 {{ expandedEntry.endAge }} 岁</strong></div>
      <div v-if="expandedEntry.startDate" class="d-row"><span>起运公历</span><strong>{{ expandedEntry.startDate }}</strong></div>

      <div v-if="analysisFor(expandedEntry.index)" class="reading">
        <div class="rd-row" v-if="analysisFor(expandedEntry.index)!.stemTenGod">
          <span>十神</span><strong>{{ analysisFor(expandedEntry.index)!.stemTenGod }}</strong>
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
        每步大运约十年，是传统命理对人生阶段的粗粒度划分，不是事实预测。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DaYunEntry, DaYunAnalysis } from '../../engine/fortune'

const props = defineProps<{
  entries: DaYunEntry[]
  analyses?: DaYunAnalysis[]
}>()

const ranges = [80, 90, 100, 120] as const
const maxAge = ref<number>(100)
const expanded = ref<number | null>(null)

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
  flex: 0 0 76px;
  text-align: center;
  cursor: pointer;
  padding: 6px 4px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  position: relative;
}
.dy-node.open { border-color: var(--accent); background: var(--card); }
.dot {
  width: 10px; height: 10px; border-radius: 50%;
  margin: 0 auto 6px;
  background: var(--muted);
}
.dy-gz { font-size: 18px; font-weight: 700; line-height: 1.2; }
.dy-age { font-size: 12px; color: var(--muted); margin-top: 2px; }

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

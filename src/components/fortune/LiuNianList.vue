<template>
  <div class="card" v-if="entries.length">
    <h2>流年列表</h2>
    <p class="muted" style="margin-top:0">
      逐年干支是传统记号，不显示"得分""发财率"之类伪精确数字；如何应对取决于现实处境与你自己的选择。
    </p>

    <!-- 分十年页 -->
    <div class="decade-row">
      <button
        v-for="d in decades" :key="d" type="button"
        :class="['dec-btn', activeDecade === d ? 'active' : '']"
        @click="switchDecade(d)"
      >{{ d }}-{{ d + 9 }}岁</button>
    </div>

    <p class="muted count">本十年共 {{ pageEntries.length }} 年（全部 {{ entries.length }} 年）</p>

    <div class="ln-list">
      <div v-for="e in pageEntries" :key="e.year" class="ln-item">
        <div class="ln-head">
          <span class="ln-year">{{ e.year }} 年</span>
          <span class="ln-age">{{ e.age }} 岁</span>
        </div>
        <div class="ln-meta">
          <span class="ln-gz">{{ e.liuNianGanzhi }}</span>
          <span class="ln-dy" v-if="e.daYunGanzhi">大运 {{ e.daYunGanzhi }}</span>
        </div>
        <div v-if="e.structureHint" class="ln-hint">{{ e.structureHint }}</div>
        <div v-if="e.clashHarmonyHint" class="ln-hint clash">{{ e.clashHarmonyHint }}</div>
        <div v-if="e.plainReading" class="ln-plain">{{ e.plainReading }}</div>
        <div v-else class="ln-plain">{{ neutralReading(e) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LiuNianEntry } from '../../engine/fortune'

const props = defineProps<{ entries: LiuNianEntry[] }>()
const emit = defineEmits<{
  (e: 'decade', decadeStart: number): void
}>()

/** 所有出现过的十年起点（0,10,20...） */
const decades = computed<number[]>(() => {
  const set = new Set<number>()
  for (const e of props.entries) {
    set.add(Math.floor(e.age / 10) * 10)
  }
  return Array.from(set).sort((a, b) => a - b)
})

const activeDecade = ref<number>(0)

const pageEntries = computed(() => {
  const lo = activeDecade.value
  const hi = lo + 9
  return props.entries.filter((e) => e.age >= lo && e.age <= hi)
})

function switchDecade(d: number) {
  activeDecade.value = d
  // 通知父组件按需扩展流年计算范围
  emit('decade', d)
}

/**
 * 中性白话（无 plainReading 时兜底）
 */
function neutralReading(e: LiuNianEntry): string {
  return `传统记号：流年 ${e.liuNianGanzhi}${e.daYunGanzhi ? `，行 ${e.daYunGanzhi} 大运` : ''}。` +
    '这只是干支层面的粗略标签；是否顺心、该做什么，仍要依据当年的实际条件来判断。'
}
</script>

<style scoped>
.decade-row {
  display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 4px;
}
.dec-btn {
  border: 1px solid var(--line);
  background: transparent; color: var(--text);
  padding: 5px 10px; font-size: 14px; cursor: pointer;
  border-radius: 8px;
}
.dec-btn.active { background: var(--accent); color: var(--bg); }
.count { margin: 4px 0 10px; }
.ln-list { display: flex; flex-direction: column; gap: 10px; }
.ln-item {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bg);
}
.ln-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.ln-year { font-size: 17px; font-weight: 700; }
.ln-age { font-size: 14px; color: var(--muted); }
.ln-meta {
  display: flex; gap: 10px; align-items: center;
  margin: 4px 0;
}
.ln-gz {
  font-size: 18px; font-weight: 700; color: var(--accent);
}
.ln-dy { font-size: 13px; color: var(--muted); }
.ln-hint {
  font-size: 14px; padding: 2px 0;
}
.ln-hint.clash { color: var(--flat); }
.ln-plain {
  font-size: 16px;
  line-height: 1.7;
  margin-top: 4px;
  color: var(--text);
}
</style>

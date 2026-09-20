<template>
  <div class="card" v-if="entries.length">
    <h2>流年列表</h2>
    <p class="muted" style="margin-top:0">
      逐年干支是传统记号，不显示"得分""发财率"之类伪精确数字；如何应对取决于现实处境与你自己的选择。
    </p>

    <!-- 年龄范围筛选 -->
    <div class="filter">
      <div class="filter-item">
        <label for="ln-from">从（岁）</label>
        <input id="ln-from" v-model.number="fromAge" type="number" inputmode="numeric" min="0" max="120" />
      </div>
      <div class="filter-item">
        <label for="ln-to">到（岁）</label>
        <input id="ln-to" v-model.number="toAge" type="number" inputmode="numeric" min="0" max="120" />
      </div>
    </div>

    <p class="muted count">共 {{ filtered.length }} 年</p>

    <div class="ln-list">
      <div v-for="e in filtered" :key="e.year" class="ln-item">
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
        <div class="ln-plain">
          {{ e.plainReading ?? neutralReading(e) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LiuNianEntry } from '../../engine/fortune'

const props = defineProps<{ entries: LiuNianEntry[] }>()

const fromAge = ref<number>(0)
const toAge = ref<number>(30)

const filtered = computed(() => {
  const lo = Number.isFinite(fromAge.value) ? fromAge.value : 0
  const hi = Number.isFinite(toAge.value) ? toAge.value : 120
  return props.entries.filter((e) => e.age >= lo && e.age <= hi)
})

/**
 * Oraculum 项目规范的中性白话：
 * 不预测确定命运，只提示"这一年在传统记号里是什么干支"，
 * 把判断权交还给现实处境与个人选择。
 */
function neutralReading(e: LiuNianEntry): string {
  return `传统记号：流年 ${e.liuNianGanzhi}${e.daYunGanzhi ? `，行 ${e.daYunGanzhi} 大运` : ''}。` +
    '这只是干支层面的粗略标签；是否顺心、该做什么，仍要依据当年的实际条件来判断。'
}
</script>

<style scoped>
.filter {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 10px 0 4px;
}
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

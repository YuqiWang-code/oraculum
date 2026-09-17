<template>
  <div>
    <h1>智能推理与预测</h1>

    <div class="card">
      <div class="muted">今日</div>
      <div style="font-size:18px">{{ today }}</div>
      <div class="muted" v-if="term">节气：{{ term }}　月建：{{ monthBranch }}　旬空：{{ xunkong.join('、') }}</div>
      <div class="muted">{{ lunar }}</div>
    </div>

    <button class="btn" @click="$router.push('/divination')">开始问卦</button>
    <button class="btn secondary" @click="$router.push('/knowledge')">资料库</button>

    <div class="card" v-if="recent.length">
      <h2>最近问卦</h2>
      <div v-for="r in recent" :key="r.id" class="muted" style="margin:6px 0" @click="$router.push('/history')">
        <span :class="labelClass(r.label)">{{ r.label }}</span>
        {{ r.hexagramName }} · {{ r.question }}
      </div>
    </div>

    <div class="card muted">
      本应用用于传统文化研究、娱乐与自我反思，不代表客观事实或未来必然结果。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listHistory } from '../db'
import type { HistoryRecord } from '../db/schema'
import { buildCalendarContext } from '../engine/calendar/calendarEngine'

const today = ref('')
const lunar = ref('')
const term = ref('')
const monthBranch = ref('')
const xunkong = ref<string[]>([])
const recent = ref<HistoryRecord[]>([])

function labelClass(l: string) {
  return l === '大吉' || l === '吉' ? 'label-good' : l === '大凶' || l === '凶' ? 'label-bad' : 'label-flat'
}

onMounted(async () => {
  const cal = buildCalendarContext({ date: new Date(), timezone: 'Asia/Shanghai' })
  today.value = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  lunar.value = cal.lunarDate
  term.value = cal.solarTerm
  monthBranch.value = cal.monthBranch
  xunkong.value = cal.xunKong
  recent.value = await listHistory(3)
})
</script>

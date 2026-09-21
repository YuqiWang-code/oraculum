<template>
  <div class="card simple-card" v-if="profile">
    <span class="layer-tag">先简单看懂</span>
    <h2 style="margin:2px 0 8px">八字是什么？</h2>
    <p class="elder-text" style="font-size:17px">
      八字，是把你的<strong>出生年月日时</strong>各换成两个传统符号，一共八个字，
      像一张「性格与人生节奏的参考图」。它帮你换个角度看不同年纪的侧重点，
      <strong>不决定命运，也不是预测</strong>。
    </p>

    <div class="birth-box">
      <div class="bb-row"><span>你的出生资料</span></div>
      <div class="bb-row"><span>历法</span><strong>{{ profile.calendarType === 'lunar' ? '农历' : '公历' }}</strong></div>
      <div class="bb-row"><span>日期</span><strong>{{ dateText }}</strong></div>
      <div class="bb-row"><span>时间</span><strong>{{ timeText }}</strong></div>
      <div class="bb-row"><span>性别参数</span><strong>{{ genderText }}</strong></div>
    </div>

    <p class="muted" style="line-height:1.8;margin-bottom:0">
      下面先用「人生阶段时间轴」讲不同年纪；传统排盘（
      <TermHelp term="四柱" />、<TermHelp term="十神" />、<TermHelp term="纳音" />
      ）和「卦象变化研究」放在后面，感兴趣再展开。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TermHelp from '../common/TermHelp.vue'
import type { BirthProfile } from '../../engine/fortune'

const props = defineProps<{ profile: BirthProfile | null }>()

const dateText = computed(() => {
  const p = props.profile
  if (!p) return ''
  const leap = p.calendarType === 'lunar' && p.lunarLeapMonth ? '闰' : ''
  const day = p.day != null ? `${p.day}日` : ''
  return `${p.year}年 ${leap}${p.month}月 ${day}`
})

const timeText = computed(() => {
  const p = props.profile
  if (!p) return ''
  if (p.hour == null) return '只填到日期（时辰未知）'
  const hh = String(p.hour).padStart(2, '0')
  const mm = p.minute != null ? String(p.minute).padStart(2, '0') : '00'
  return `${hh}:${mm}`
})

const genderText = computed(() => {
  const g = props.profile?.traditionalGenderParam
  return g === 'male' ? '男' : g === 'female' ? '女' : '未指定'
})
</script>

<style scoped>
.simple-card { border-top: 4px solid var(--cinnabar); }
.birth-box { background: var(--paper-2); border-radius: 12px; padding: 8px 14px; margin: 12px 0; }
.bb-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--line); font-size: 15px; }
.bb-row:last-child { border-bottom: none; }
.bb-row span { color: var(--muted); }
</style>

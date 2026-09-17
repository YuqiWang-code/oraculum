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

      <label>起卦方式</label>
      <select v-model="mode">
        <option value="meihua_time">梅花易数·时间起卦（默认）</option>
        <option value="manual_hexagram">六爻·手动录入阴阳动静</option>
      </select>

      <label>起卦时间</label>
      <input v-model="castTime" type="datetime-local" />

      <label>时区</label>
      <select v-model="timezone">
        <option value="Asia/Shanghai">Asia/Shanghai</option>
        <option value="UTC">UTC</option>
      </select>
    </div>

    <button class="btn" @click="doCast">起卦</button>
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
import { runMeihuaTime, runLiuyao } from '../engine/orchestrator'
import { buildCalendarContext } from '../engine/calendar/calendarEngine'
import { castMeihuaByTime } from '../engine/meihua/castByTime'
import { saveRecord } from '../db'
import type { QuestionCategory, Gender, CastingMode, YinYang } from '../types'

const router = useRouter()
const store = useAppStore()

const question = ref('')
const category = ref<QuestionCategory>('日常综合')
const alias = ref('')
const gender = ref<Gender>('unspecified')
const mode = ref<CastingMode>('meihua_time')
const timezone = ref('Asia/Shanghai')
const castTime = ref(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16))

const categories = QUESTION_CATEGORIES

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

async function doCast() {
  if (!question.value.trim()) { alert('请输入所问之事'); return }
  const input = {
    id: id(),
    createdAt: new Date().toISOString(),
    timezone: timezone.value,
    question: question.value.trim(),
    category: category.value,
    querentAlias: alias.value || undefined,
    gender: gender.value,
    castingMode: mode.value,
    castTime: new Date(castTime.value).toISOString()
  }

  let rec
  if (mode.value === 'meihua_time') {
    rec = runMeihuaTime(input, store.settings.useShenshaInScore)
  } else {
    // 手动模式 v1：以当前梅花卦结构作为六爻输入（综合实验，非单一古法）
    const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
    const mh = castMeihuaByTime(cal)
    const lines = mh.ben.lines as YinYang[]
    const mask = lines.map((_, i) => i === mh.movingIndex0)
    rec = runLiuyao(input, lines, mask, store.settings.useShenshaInScore)
  }

  store.lastResult = rec
  await saveRecord(rec)
  router.push('/result')
}
</script>

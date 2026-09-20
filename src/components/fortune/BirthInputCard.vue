<template>
  <div class="card">
    <h2>出生资料</h2>
    <p class="muted" style="margin-top:0">
      输入越完整，能展示的内容越多。缺时辰不伪造时柱；不指定性别不推算精确大运。
    </p>

    <!-- 历法类型 -->
    <div class="field-row">
      <label>历法</label>
      <div class="segmented">
        <button
          type="button"
          :class="['seg-btn', form.calendarType === 'solar' ? 'active' : '']"
          @click="form.calendarType = 'solar'"
        >公历</button>
        <button
          type="button"
          :class="['seg-btn', form.calendarType === 'lunar' ? 'active' : '']"
          @click="form.calendarType = 'lunar'"
        >农历</button>
      </div>
    </div>

    <!-- 年 / 月 -->
    <div class="grid-2">
      <div>
        <label for="b-year">年（必填）</label>
        <input id="b-year" v-model.number="form.year" type="number" inputmode="numeric"
               min="1900" max="2100" placeholder="例如 1995" />
      </div>
      <div>
        <label for="b-month">月（必填）</label>
        <input id="b-month" v-model.number="form.month" type="number" inputmode="numeric"
               min="1" max="12" placeholder="1-12" />
      </div>
    </div>

    <!-- 农历闰月选择（仅农历且该月确为闰月时显示） -->
    <div v-if="form.calendarType === 'lunar' && leapMonth === form.month" class="field-row">
      <label>该月类型</label>
      <div class="segmented">
        <button type="button" :class="['seg-btn', !form.lunarLeapMonth ? 'active' : '']"
                @click="form.lunarLeapMonth = false">普通{{ form.month }}月</button>
        <button type="button" :class="['seg-btn', form.lunarLeapMonth ? 'active' : '']"
                @click="form.lunarLeapMonth = true">闰{{ form.month }}月</button>
      </div>
    </div>
    <p v-if="form.calendarType === 'lunar' && form.year && form.month && leapMonth !== form.month"
       class="muted tip">
      {{ form.year }}年{{ leapMonthText }}。
    </p>

    <!-- 日 / 时 / 分 -->
    <div class="grid-3">
      <div>
        <label for="b-day">日（选填）</label>
        <input id="b-day" v-model.number="form.day" type="number" inputmode="numeric"
               min="1" max="31" placeholder="日" />
      </div>
      <div>
        <label for="b-hour">时（选填）</label>
        <input id="b-hour" v-model.number="form.hour" type="number" inputmode="numeric"
               min="0" max="23" placeholder="0-23" />
      </div>
      <div>
        <label for="b-minute">分（选填）</label>
        <input id="b-minute" v-model.number="form.minute" type="number" inputmode="numeric"
               min="0" max="59" placeholder="0-59" />
      </div>
    </div>

    <!-- 性别参数 -->
    <div class="field-row">
      <label>传统性别参数</label>
      <div class="segmented">
        <button type="button" :class="['seg-btn', form.traditionalGenderParam === 'male' ? 'active' : '']"
                @click="form.traditionalGenderParam = 'male'">男</button>
        <button type="button" :class="['seg-btn', form.traditionalGenderParam === 'female' ? 'active' : '']"
                @click="form.traditionalGenderParam = 'female'">女</button>
        <button type="button" :class="['seg-btn', form.traditionalGenderParam === 'unspecified' ? 'active' : '']"
                @click="form.traditionalGenderParam = 'unspecified'">不指定</button>
      </div>
    </div>
    <p class="muted tip">传统大运顺逆以出生年阴阳与男/女为准（由引擎按 yun.isForward() 计算）；选"不指定"时不计算精确大运与流年。</p>

    <!-- 八字日界（晚子时） -->
    <div class="field-row">
      <label>八字日界</label>
      <div class="segmented">
        <button type="button" :class="['seg-btn', form.daySect === 2 ? 'active' : '']"
                @click="form.daySect = 2">00:00换日</button>
        <button type="button" :class="['seg-btn', form.daySect === 1 ? 'active' : '']"
                @click="form.daySect = 1">23:00子初换日</button>
      </div>
    </div>
    <p class="muted tip">23:00-23:59 出生时，日界规则会影响日柱归属；"00:00换日"按当天，"23:00子初换日"按次日。</p>

    <!-- 时区 -->
    <div>
      <label for="b-tz">时区</label>
      <select id="b-tz" v-model="form.timezone">
        <option value="Asia/Shanghai">Asia/Shanghai（中国标准时间）</option>
        <option value="Asia/Urumqi">Asia/Urumqi</option>
        <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
        <option value="Asia/Taipei">Asia/Taipei</option>
        <option value="Asia/Tokyo">Asia/Tokyo</option>
        <option value="UTC">UTC</option>
      </select>
    </div>

    <!-- 保存本地 -->
    <label class="check-row">
      <input type="checkbox" v-model="form.saveLocally" class="check-input" />
      <span>保存本地档案</span>
    </label>
    <p class="muted tip">默认本次计算不保存，只有主动勾选才写入本地。</p>

    <!-- 精度诚实提示 -->
    <div class="precision-box" :class="precisionClass">
      <strong>{{ precisionLabel }}</strong>
      <span class="muted">{{ precisionHint }}</span>
    </div>

    <button class="btn" :disabled="!canCompute" @click="onCompute">计算</button>
    <p v-if="errorMsg" class="muted error">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { LunarYear } from 'lunar-javascript'
import type { BirthProfile, BirthPrecision } from '../../engine/fortune'

const emit = defineEmits<{
  (e: 'compute', profile: BirthProfile): void
}>()

/** 由 FortuneView 调用：用已保存档案填充表单 */
function fillFromProfile(p: BirthProfile) {
  form.calendarType = p.calendarType
  form.year = p.year
  form.month = p.month
  form.day = p.day ?? null
  form.hour = p.hour ?? null
  form.minute = p.minute ?? null
  form.timezone = p.timezone
  form.traditionalGenderParam = p.traditionalGenderParam
  form.saveLocally = false
  form.lunarLeapMonth = p.lunarLeapMonth ?? false
  form.daySect = p.daySect ?? 2
  errorMsg.value = ''
}
defineExpose({ fillFromProfile })

interface FormState {
  calendarType: 'solar' | 'lunar'
  year: number | null
  month: number | null
  day: number | null
  hour: number | null
  minute: number | null
  timezone: string
  traditionalGenderParam: 'male' | 'female' | 'unspecified'
  saveLocally: boolean
  lunarLeapMonth: boolean
  daySect: 1 | 2
}

const form = reactive<FormState>({
  calendarType: 'solar',
  year: null,
  month: null,
  day: null,
  hour: null,
  minute: null,
  timezone: 'Asia/Shanghai',
  traditionalGenderParam: 'unspecified',
  saveLocally: false,
  lunarLeapMonth: false,
  daySect: 2
})

const errorMsg = ref('')

const hasYear = computed(() => form.year != null && Number.isFinite(form.year))
const hasMonth = computed(() => form.month != null && form.month >= 1 && form.month <= 12)
const hasDay = computed(() => form.day != null && form.day >= 1 && form.day <= 31)
const hasHour = computed(() => form.hour != null && form.hour >= 0 && form.hour <= 23)

/** 该年闰月（0=无闰月） */
const leapMonth = computed<number>(() => {
  if (!hasYear.value) return 0
  try {
    return LunarYear.fromYear(form.year as number).getLeapMonth()
  } catch {
    return 0
  }
})

const leapMonthText = computed(() => {
  if (leapMonth.value === 0) return '该年没有闰月'
  return `该年闰${leapMonth.value}月`
})

const precision = computed<BirthPrecision | null>(() => {
  if (hasYear.value && hasMonth.value && hasDay.value && hasHour.value) return 'exact_time'
  if (hasYear.value && hasMonth.value && hasDay.value) return 'date'
  if (hasYear.value && hasMonth.value) return 'year_month'
  return null
})

const precisionLabel = computed(() => {
  switch (precision.value) {
    case 'exact_time': return '完整四柱'
    case 'date': return '三柱，时柱未知'
    case 'year_month': return '仅出生年月（不伪造节令柱）'
    default: return '请至少填写出生年月'
  }
})

const precisionHint = computed(() => {
  switch (precision.value) {
    case 'exact_time': return form.minute != null
      ? '出生年月日时（含分）齐全，可排大运与流年。'
      : '只有时辰没有分钟，按该时辰起点排盘，起运精度有限。'
    case 'date': return '缺出生时辰，时柱未知，不推算大运流年。'
    case 'year_month': return '只有年月，年/月柱会因节气交界而不确定，不伪造。'
    default: return '先填出生年与月。'
  }
})

const precisionClass = computed(() => {
  switch (precision.value) {
    case 'exact_time': return 'ok'
    case 'date': return 'warn'
    case 'year_month': return 'warn'
    default: return 'idle'
  }
})

const canCompute = computed(() => precision.value !== null)

function onCompute() {
  errorMsg.value = ''
  const p = precision.value
  if (!p) {
    errorMsg.value = '请至少填写出生年与月。'
    return
  }
  if (!hasYear.value || !hasMonth.value) {
    errorMsg.value = '出生年和月为必填。'
    return
  }
  const profile: BirthProfile = {
    calendarType: form.calendarType,
    year: Math.floor(form.year as number),
    month: Math.floor(form.month as number),
    day: form.day != null ? Math.floor(form.day) : undefined,
    hour: form.hour != null ? Math.floor(form.hour) : undefined,
    minute: form.minute != null && Number.isFinite(form.minute) ? Math.floor(form.minute) : undefined,
    timezone: form.timezone,
    precision: p,
    traditionalGenderParam: form.traditionalGenderParam,
    saveLocally: form.saveLocally,
    lunarLeapMonth: form.calendarType === 'lunar' ? form.lunarLeapMonth : undefined,
    daySect: form.daySect,
    timePrecision: form.minute != null ? 'minute' : (form.hour != null ? 'hour' : undefined)
  }
  emit('compute', profile)
}
</script>

<style scoped>
.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0;
  flex-wrap: wrap;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.segmented {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}
.seg-btn {
  border: none;
  background: transparent;
  color: var(--text);
  padding: 8px 14px;
  font-size: 16px;
  cursor: pointer;
}
.seg-btn.active {
  background: var(--accent);
  color: var(--bg);
}
.tip {
  margin: 2px 0 8px;
  line-height: 1.6;
}
.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 2px;
  font-size: 16px;
  color: var(--text);
}
.check-input {
  width: auto;
  margin: 0;
  flex: 0 0 auto;
}
.precision-box {
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  font-size: 16px;
  line-height: 1.7;
}
.precision-box.ok { background: rgba(46, 125, 79, 0.08); border-color: var(--good); }
.precision-box.warn { background: rgba(138, 122, 58, 0.08); border-color: var(--flat); }
.precision-box.idle { background: var(--bg); }
.precision-box .muted { display: block; font-size: 14px; }
.error { color: var(--bad); }
</style>

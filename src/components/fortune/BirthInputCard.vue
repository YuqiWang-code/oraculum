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
    <p class="muted tip">传统大运顺逆需要选择男 / 女参数；选“不指定”时不计算精确大运与流年。</p>

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
import type { BirthProfile, BirthPrecision } from '../../engine/fortune'

const emit = defineEmits<{
  (e: 'compute', profile: BirthProfile): void
}>()

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
  saveLocally: false
})

const errorMsg = ref('')

const hasYear = computed(() => form.year != null && Number.isFinite(form.year))
const hasMonth = computed(() => form.month != null && form.month >= 1 && form.month <= 12)
const hasDay = computed(() => form.day != null && form.day >= 1 && form.day <= 31)
const hasHour = computed(() => form.hour != null && form.hour >= 0 && form.hour <= 23)

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
    case 'year_month': return '仅展示年月二柱'
    default: return '请至少填写出生年月'
  }
})

const precisionHint = computed(() => {
  switch (precision.value) {
    case 'exact_time': return '出生年月日时齐全，可排大运与流年。'
    case 'date': return '缺出生时辰，时柱未知，不推算大运流年。'
    case 'year_month': return '只有年月，不推算大运流年。'
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
    saveLocally: form.saveLocally
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

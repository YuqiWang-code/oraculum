<template>
  <div class="card">
    <h2>六源合参 <span class="tag warn">实验</span></h2>
    <div class="muted">本项目现代实验规则，非古籍原法。一次完成六个起卦点，逐步锁定。</div>
    <div style="display:flex;gap:4px;margin:10px 0">
      <div v-for="i in 6" :key="i" :class="['step', i<=step?'on':'']">{{ i }}</div>
    </div>

    <!-- 1 秒级时间 -->
    <div v-if="step===1">
      <p>1/6 此刻时间：{{ timeText }} <span class="muted">（自动取当前本地秒）</span></p>
      <button class="btn" @click="lockTime">锁定</button>
    </div>
    <!-- 2 随机数 -->
    <div v-else-if="step===2">
      <p>2/6 随机数：{{ random || '未生成' }}</p>
      <button class="btn secondary" @click="random = rollRandomNumbers()[0]">生成一个</button>
      <button class="btn" :disabled="!random" @click="step=3">锁定</button>
    </div>
    <!-- 3 骰子 -->
    <div v-else-if="step===3">
      <p>3/6 骰子：d8={{ diceD8 }} d6={{ diceD6 }}</p>
      <button class="btn secondary" @click="roll">摇骰</button>
      <button class="btn" :disabled="!diceD8" @click="step=4">锁定</button>
    </div>
    <!-- 4 外应 -->
    <div v-else-if="step===4">
      <p>4/6 外应：</p>
      <select v-model="omenValue"><option v-for="s in symbols" :key="s" :value="s">{{ s }}</option></select>
      <p>方位：</p>
      <select v-model="omenDir"><option v-for="d in directions" :key="d" :value="d">{{ d }}</option></select>
      <button class="btn" :disabled="!omenValue||!omenDir" @click="step=5">锁定</button>
    </div>
    <!-- 5 文字 -->
    <div v-else-if="step===5">
      <p>5/6 文字（≥11字）：{{ textCount }}字</p>
      <textarea v-model="text" rows="2"></textarea>
      <button class="btn" :disabled="textCount<11||textCount>100" @click="step=6">锁定</button>
    </div>
    <!-- 6 铜钱 -->
    <div v-else-if="step===6">
      <p>6/6 三枚钱一掷：{{ coinThrow ? `和=${coinThrow.sum}` : '未投' }}</p>
      <div v-if="coinThrow" style="font-size:14px">
        <span v-for="(c,i) in coinThrow.coins" :key="i" :class="c===3?'label-good':'label-bad'">
          {{ c===3?'正(3)':'反(2)' }}{{ i<2?'、':'' }}
        </span>
      </div>
      <button class="btn secondary" :disabled="!!coinThrow" @click="flipThree">掷三枚钱</button>
      <button class="btn" :disabled="!coinThrow" @click="finish">合成并起卦</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { SixSourcePayload } from '../../types'
import { formatDateTimeLocalSeconds, formatDisplaySeconds } from '../../utils/datetime'
import { rollRandomNumbers } from '../../engine/casting/castByRandomNumbers'
import { rollD6, rollD8, flipThreeCoins } from '../../engine/casting/secureRandom'
import { normalizeText, countGraphemes } from '../../engine/casting/castByText'
import { SYMBOL_TO_TRIGRAM } from '../../engine/casting/castByExternalOmen'
import { TRIGRAMS } from '../../data/trigrams'

const emit = defineEmits<{ (e: 'confirm', payload: { payload: SixSourcePayload }): void }>()
const step = ref(1)
const symbols = Object.keys(SYMBOL_TO_TRIGRAM)
const directions = ['西北', '西', '南', '东', '东南', '北', '东北', '西南']

const exactTime = ref('')
const secondOfHour = ref(0)
const random = ref(0)
const diceD8 = ref(0), diceD6 = ref(0)
const omenValue = ref('水'), omenDir = ref('北')
const text = ref('这是一段六源合参的占位文字内容示例')
// v3.1 修复：coinThrow 为 null 时不能 finish，必须真正掷三枚钱
const coinThrow = ref<{ coins: [2 | 3, 2 | 3, 2 | 3]; sum: 6 | 7 | 8 | 9 } | null>(null)

// v3.1 修复：时间实时刷新
const timeText = ref('')
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timeText.value = formatDisplaySeconds(new Date())
  timer = setInterval(() => { timeText.value = formatDisplaySeconds(new Date()) }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const textCount = computed(() => countGraphemes(normalizeText(text.value)))

function lockTime() {
  const d = new Date()
  exactTime.value = formatDateTimeLocalSeconds(d)
  secondOfHour.value = d.getMinutes() * 60 + d.getSeconds()
  step.value = 2
}
function roll() { diceD8.value = rollD8(); diceD6.value = rollD6() }
function flipThree() {
  coinThrow.value = flipThreeCoins()
}
function finish() {
  if (!coinThrow.value) return
  const payload: SixSourcePayload = {
    version: 'six_source_hybrid_v1',
    exactTime: exactTime.value,
    secondOfHour: secondOfHour.value,
    randomNumber: random.value,
    dice: { d8: diceD8.value, d6: diceD6.value },
    omen: {
      kind: 'symbol',
      value: omenValue.value,
      trigramNumber: TRIGRAMS[SYMBOL_TO_TRIGRAM[omenValue.value]].xiantianNumber
    },
    text: { normalized: normalizeText(text.value), graphemeCount: textCount.value },
    coin: { coins: coinThrow.value.coins, sum: coinThrow.value.sum }
  }
  emit('confirm', { payload })
}
</script>

<style scoped>
.step { flex:1;height:6px;background:var(--line);border-radius:3px }
.step.on { background:var(--accent) }
</style>

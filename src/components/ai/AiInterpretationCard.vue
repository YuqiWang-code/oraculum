<template>
  <div class="card">
    <h2>AI 深度解读 <span class="tag" style="background:#8e44ad;color:#fff">AI 增强 · 非确定性</span></h2>
    <div class="muted">本地规则结果已生成。AI 深度解读需联网，并把本次必要卦象结构发送到 AI 服务；不改变卦象与评分。</div>

    <button v-if="!result && !loading" class="btn" @click="generate">生成 AI 深度解读</button>
    <button v-if="cached && !loading" class="btn secondary" @click="regenerate">重新生成（会产生新 API 用量）</button>
    <div v-if="loading" class="muted">AI 解读中…</div>
    <div v-if="error" class="muted" style="color:#c0392b">{{ error }}</div>

    <template v-if="result">
      <div style="font-size:12px;color:var(--muted);margin:6px 0">
        模型 {{ model }} · {{ modelTime }}
      </div>
      <h3>AI 综合结论</h3>
      <p>{{ result.answer }}</p>

      <h3>传统术数解读</h3>
      <p>{{ result.traditionalReading.summary }}</p>
      <div v-for="(f,i) in result.traditionalReading.favorable" :key="'f'+i" class="label-good">+ {{ f }}</div>
      <div v-for="(c,i) in result.traditionalReading.constraints" :key="'c'+i" class="label-bad">− {{ c }}</div>
      <p class="muted">{{ result.traditionalReading.trend }}</p>

      <template v-if="result.timing.applicable">
        <h3>时间倾向</h3>
        <div>传统象意窗口：{{ result.timing.window }}　确定性：{{ confidenceText(result.timing.confidence) }}</div>
        <div class="muted">这是传统象意的宽泛时间解释，不是事实预测。</div>
      </template>

      <template v-if="result.likelihood.applicable">
        <h3>可能性 / 可行性</h3>
        <div>传统规则倾向：{{ result.likelihood.traditionalScore }} / 100 · {{ result.likelihood.traditionalLabel }}（来自本地评分，非现实概率）</div>
        <div>现实可行性：{{ feasibilityText(result.likelihood.realityFeasibility) }}</div>
        <div class="muted">{{ result.likelihood.explanation }}</div>
      </template>

      <h3>现实核对</h3>
      <p>{{ result.realityCheck }}</p>
      <h3>行动提示</h3>
      <div v-for="(a,i) in result.actionSuggestions" :key="'a'+i">· {{ a }}</div>
      <h3>不确定因素</h3>
      <div v-for="(u,i) in result.uncertainties" :key="'u'+i" class="muted">· {{ u }}</div>
    </template>

    <div v-if="result">
      <h3>继续追问</h3>
      <div v-for="(m,i) in messages" :key="i" :style="{opacity: m.role==='user'?0.8:1}">
        <b>{{ m.role==='user'?'问':'AI' }}：</b>{{ m.content }}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input v-model="question" placeholder="例如：最大的阻力是什么？" style="flex:1" />
        <button class="btn secondary" :disabled="busy || !question.trim()" @click="followUp">问</button>
      </div>
      <div v-if="safetyBlocked" class="muted" style="color:#c0392b">这个问题不适合用 AI 继续判断。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DivinationRecord } from '../../engine/orchestrator'
import type { AiInterpretation, AiChatMessage, RealityFeasibility } from '../../types/ai'
import { requestAiInterpretation, askAiFollowUp } from '../../services/ai'
import { getAiSession, saveAiSession } from '../../db'

const props = defineProps<{ record: DivinationRecord }>()
const result = ref<AiInterpretation | null>(null)
const cached = ref(false)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const model = ref('')
const modelTime = ref('')
const messages = ref<AiChatMessage[]>([])
const question = ref('')
const safetyBlocked = ref(false)

onMounted(async () => {
  const s = await getAiSession(props.record.id)
  if (s) {
    result.value = s.response
    messages.value = s.messages
    model.value = s.model
    modelTime.value = new Date(s.updatedAt).toLocaleString('zh-CN', { hour12: false })
    cached.value = true
  }
})

async function generate() {
  loading.value = true; error.value = ''
  try {
    const r = await requestAiInterpretation(props.record)
    result.value = r
    model.value = 'gpt'
    modelTime.value = new Date().toLocaleString('zh-CN', { hour12: false })
    await saveAiSession(props.record.id, r, [], model.value)
  } catch (e: any) {
    error.value = 'AI 深度解读暂时不可用。你的本地确定性卦象和评分不受影响。'
  } finally { loading.value = false }
}
async function regenerate() {
  cached.value = false
  await generate()
}
async function followUp() {
  const q = question.value.trim()
  if (!q) return
  busy.value = true; safetyBlocked.value = false
  messages.value.push({ role: 'user', content: q })
  question.value = ''
  try {
    const { result: r, safetyBlocked: sb } = await askAiFollowUp(props.record, messages.value, q)
    if (sb) { safetyBlocked.value = true } else {
      result.value = r
      messages.value.push({ role: 'assistant', content: r.answer })
      await saveAiSession(props.record.id, r, messages.value, model.value)
    }
  } catch {
    error.value = 'AI 追问失败。'
  } finally { busy.value = false }
}
function feasibilityText(f: RealityFeasibility) {
  return { low: '偏低', somewhat_low: '略偏低', uncertain: '不确定', somewhat_high: '略偏高', high: '偏高', insufficient_information: '信息不足', not_applicable: '不适用' }[f]
}
function confidenceText(c: 'low' | 'medium' | 'not_applicable') {
  return { low: '低', medium: '中', not_applicable: '不适用' }[c]
}
</script>

<style scoped>
h3 { font-size:15px; margin:10px 0 4px }
.tag { font-size:11px; padding:2px 6px; border-radius:8px }
</style>

<template>
  <div v-if="loading" class="card muted">加载中…</div>

  <div v-else-if="notFound" class="card">
    <h2>记录不存在</h2>
    <p>未找到这一卦的记录，可能已被删除。</p>
    <button class="btn" @click="$router.push('/')">返回首页</button>
  </div>

  <template v-else-if="rec">
    <ModeToggle />

    <!-- 标题与所问 -->
    <div class="title-row">
      <h1>
        <span class="gua-unicode">{{ rec.meihua ? rec.meihua.ben.unicode : rec.liuyao?.hexagram.unicode }}</span>
        {{ rec.meihua ? rec.meihua.ben.name : rec.liuyao?.hexagram.name }}卦
      </h1>
      <span class="tag cinnabar">{{ rec.rating.label }} · {{ rec.rating.score }}分</span>
    </div>

    <div class="card">
      <div class="muted">你问的是</div>
      <div style="font-size:17px;font-weight:600;margin:2px 0 4px">{{ rec.input.question }}</div>
      <div class="muted">
        {{ rec.input.category }}<span v-if="rec.input.querentAlias"> · {{ rec.input.querentAlias }}</span>
      </div>
    </div>

    <!-- ============ 第一层：老人也能一眼看懂 ============ -->
    <section class="layer l1">
      <span class="layer-tag">第一层 · 一句话先看懂</span>
      <div v-if="realWorldReading" class="headline">{{ realWorldReading.headline.replace(/^「[^」]+」·\s*/, '') }}</div>
      <p v-if="plain" class="one-liner">{{ plain.oneLiner }}</p>
      <div v-if="elderLoading && !realWorldReading" class="muted">正在整理本地白话…</div>

      <template v-if="realWorldReading">
        <p class="elder-text" style="margin:10px 0 4px">{{ realWorldReading.currentSituation }}</p>

        <div v-if="realWorldReading.howToAct.length" style="margin-top:12px">
          <div class="layer-tag" style="margin-bottom:2px">可以怎么做</div>
          <ul class="act-list">
            <li v-for="(a, i) in realWorldReading.howToAct.slice(0, 4)" :key="'act' + i">{{ a }}</li>
          </ul>
        </div>

        <div v-if="realWorldReading.watchOutFor.length" style="margin-top:10px">
          <div class="layer-tag" style="margin-bottom:2px">需要留心</div>
          <ul class="act-list" style="--c:var(--cinnabar)">
            <li v-for="(w, i) in realWorldReading.watchOutFor.slice(0, 3)" :key="'w' + i"
                style="--marker:var(--cinnabar)">{{ w }}</li>
          </ul>
        </div>

        <div v-if="plain?.realityGuard || realWorldReading.realityGuard" class="reality-note">
          ⚠ {{ plain?.realityGuard || realWorldReading.realityGuard }}
        </div>
      </template>
    </section>

    <!-- ============ 第二层：为什么这么看 ============ -->
    <section class="layer l2">
      <span class="layer-tag">第二层 · 为什么这么看</span>

      <template v-if="realWorldReading">
        <div v-if="realWorldReading.why.base" class="why-item">
          <span class="why-label"><TermHelp term="本卦" /></span>
          <span>{{ realWorldReading.why.base }}</span>
        </div>
        <div v-for="(m, i) in realWorldReading.why.moving" :key="'wm' + i" class="why-item">
          <span class="why-label"><TermHelp term="动爻" /></span>
          <span>{{ m }}</span>
        </div>
        <div v-if="realWorldReading.why.mutual" class="why-item">
          <span class="why-label"><TermHelp term="互卦" /></span>
          <span>{{ realWorldReading.why.mutual }}</span>
        </div>
        <div v-if="realWorldReading.why.changed" class="why-item">
          <span class="why-label"><TermHelp term="变卦" /></span>
          <span>{{ realWorldReading.why.changed }}</span>
        </div>
        <div v-if="realWorldReading.why.bodyUse" class="why-item">
          <span class="why-label"><TermHelp term="体用" /></span>
          <span>{{ realWorldReading.why.bodyUse }}</span>
        </div>
        <div v-if="realWorldReading.why.rating" class="why-item">
          <span class="why-label">综合看</span>
          <span>{{ realWorldReading.why.rating }}</span>
        </div>
      </template>

      <!-- 古文 → 今解 → 提醒 -->
      <template v-if="detailed">
        <div class="classic-flow" v-for="(sec, i) in classicFlowSections" :key="sec.key">
          <details class="classic-block" style="margin-bottom:0">
            <summary style="font-weight:700;color:var(--ink-soft)">📜 {{ sec.title }} · 古文原文</summary>
            <div v-for="ct in sec.classicTexts" :key="ct.label" style="margin-top:8px">
              <div class="muted">{{ ct.label }}</div>
              <div class="classic-text">{{ ct.text }}</div>
            </div>
          </details>
          <div class="flow-arrow">↓</div>
          <div class="classic-block">
            <div class="layer-tag">今天怎么理解</div>
            <div class="modern-text">{{ sec.plainExplanation }}</div>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="classic-block" style="border-left:3px solid var(--cinnabar)">
            <div class="layer-tag" style="color:var(--cinnabar)">现实提醒</div>
            <div class="remind-text">{{ sec.roleExplanation }}</div>
          </div>
          <div v-if="i < classicFlowSections.length - 1" style="height:10px" />
        </div>
      </template>
    </section>

    <!-- 分享 -->
    <ShareCard
      :name="hexName"
      :unicode="hexUnicode"
      :one-liner="(plain?.oneLiner || realWorldReading?.headline || '')"
      :tendency-label="`${rec.rating.label} · ${rec.rating.score}分`"
    />

    <!-- ============ 第三层：专业分析（简单模式折叠 / 研究模式展开） ============ -->
    <details v-if="!isResearch" class="guofeng pro-fold">
      <summary>📚 第三层 · 专业分析（排盘、体用、评分、原文）</summary>
      <div class="details-body">
        <ResultProfessional :rec="rec" :detailed="detailed" :rw="realWorldReading" />
      </div>
    </details>

    <ResultProfessional v-else :rec="rec" :detailed="detailed" :rw="realWorldReading" />

    <!-- 操作 -->
    <button class="btn secondary" @click="copyText">复制文字结果</button>
    <button class="btn secondary" @click="$router.push('/divination')">再问一卦</button>
    <button class="btn secondary" @click="$router.push('/')">返回首页</button>

    <div class="card muted" style="line-height:1.8">
      传统文化研究与娱乐参考，不预测未来、不替你做决定；重要事情请依据事实和专业意见。
      所有解读均来自本地经典数据与确定性规则，不联网、不调用 AI。
    </div>
  </template>

  <div v-else class="card muted">尚无结果，请先去问卦。</div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import ModeToggle from '../components/common/ModeToggle.vue'
import TermHelp from '../components/common/TermHelp.vue'
import ShareCard from '../components/result/ShareCard.vue'
import ResultProfessional from '../components/result/ResultProfessional.vue'
import { getRecord } from '../db'
import { composeMeihuaInterpretation } from '../engine/localInterpretation/composeMeihuaInterpretation'
import { composeLiuyaoInterpretation } from '../engine/localInterpretation/composeLiuyaoInterpretation'
import type { LocalDetailedInterpretation } from '../engine/localInterpretation/types'
import { interpretMeihuaPlain, interpretLiuyaoPlain } from '../engine/plainInterpretation'
import type { PlainInterpretation } from '../engine/plainInterpretation'
import { interpretMeihuaRealWorld, interpretLiuyaoRealWorld } from '../engine/realWorldInterpretation'
import type { RealWorldPlainReading } from '../engine/realWorldInterpretation'
import { loadElderFriendlyBatches } from '../local-data'
import type { DivinationRecord } from '../engine/orchestrator'

const route = useRoute()
const store = useAppStore()

type RecordWithRealWorld = DivinationRecord & { realWorldReading?: RealWorldPlainReading }

const rec = ref<RecordWithRealWorld | null>(null)
const loading = ref(true)
const notFound = ref(false)

async function load() {
  const id = String(route.params.id || '')
  if (store.lastResult && store.lastResult.id === id) {
    rec.value = store.lastResult as RecordWithRealWorld
    loading.value = false
    notFound.value = false
    return
  }
  loading.value = true
  notFound.value = false
  const r = await getRecord(id)
  rec.value = (r ?? null) as RecordWithRealWorld | null
  loading.value = false
  notFound.value = !r
}

onMounted(load)
watch(() => route.params.id, load)

const detailed = computed<LocalDetailedInterpretation | undefined>(() => {
  const r = rec.value
  if (!r) return undefined
  if (r.meihua) return composeMeihuaInterpretation(r.meihua, r.rating, r.input.category)
  if (r.liuyao) {
    return composeLiuyaoInterpretation(r.liuyao, r.rating, r.input.category, r.calendar.monthBranch, r.calendar.dayGanzhi)
  }
  return undefined
})

const plain = computed<PlainInterpretation | undefined>(() => {
  const r = rec.value
  if (!r) return undefined
  if (r.plainInterpretation) return r.plainInterpretation
  try {
    if (r.meihua) return interpretMeihuaPlain(r.input.question, r.input.category, r.meihua, r.rating)
    if (r.liuyao) {
      return interpretLiuyaoPlain(
        r.input.question, r.input.category, r.liuyao, r.rating,
        r.calendar.monthBranch, r.calendar.dayGanzhi
      )
    }
  } catch {
    return undefined
  }
  return undefined
})

const elderLoading = ref(false)
const realWorldReading = shallowRef<RealWorldPlainReading | undefined>(undefined)

function collectKingWens(r: RecordWithRealWorld): number[] {
  const kws: number[] = []
  if (r.meihua) kws.push(r.meihua.ben.kingWen, r.meihua.hu.kingWen, r.meihua.bian.kingWen)
  if (r.liuyao) {
    kws.push(r.liuyao.hexagram.kingWen)
    if (r.liuyao.changedHexagram) kws.push(r.liuyao.changedHexagram.kingWen)
  }
  return kws
}

async function loadRealWorldForRecord(r: RecordWithRealWorld): Promise<void> {
  if (r.realWorldReading) realWorldReading.value = r.realWorldReading
  elderLoading.value = true
  try {
    await loadElderFriendlyBatches(collectKingWens(r))
    if (r.realWorldReading) {
      realWorldReading.value = r.realWorldReading
      return
    }
    try {
      if (r.meihua) {
        realWorldReading.value = interpretMeihuaRealWorld(r.input.question, r.input.category, r.meihua, r.rating)
      } else if (r.liuyao) {
        realWorldReading.value = interpretLiuyaoRealWorld(
          r.input.question, r.input.category, r.liuyao, r.rating,
          r.calendar.monthBranch, r.calendar.dayGanzhi
        )
      }
    } catch {
      realWorldReading.value = undefined
    }
  } finally {
    elderLoading.value = false
  }
}

watch(
  rec,
  (r) => {
    if (!r) {
      realWorldReading.value = undefined
      return
    }
    if (r.realWorldReading) realWorldReading.value = r.realWorldReading
    void loadRealWorldForRecord(r)
  },
  { immediate: true }
)

const readingMode = computed<'simple' | 'research'>(() => {
  const s = store.settings
  if (s.readingMode) return s.readingMode
  if (s.resultDisplayMode === 'detailed_only') return 'research'
  return 'simple'
})
const isResearch = computed(() => readingMode.value === 'research')

const hexName = computed(() => rec.value ? (rec.value.meihua?.ben.name ?? rec.value.liuyao?.hexagram.name ?? '') : '')
const hexUnicode = computed(() => rec.value ? (rec.value.meihua?.ben.unicode ?? rec.value.liuyao?.hexagram.unicode ?? '') : '')

/** 第二层「古文→今解→提醒」只取本卦与第一动爻，避免一次堆太多 */
const classicFlowSections = computed(() => {
  const d = detailed.value
  if (!d) return []
  const out: any[] = []
  if (d.base) out.push({ key: 'base', ...d.base })
  if (d.movingLines?.[0]) out.push({ key: 'moving', ...d.movingLines[0] })
  return out
})

function copyText() {
  if (!rec.value) return
  const r = rec.value
  const d = detailed.value
  const pw = plain.value
  const rw = realWorldReading.value
  const parts: string[] = []
  parts.push('【今日问卦 · Oraculum】')
  parts.push(`所问：${r.input.question}（${r.input.category}）`)
  parts.push(`卦：${r.meihua?.ben.name ?? r.liuyao?.hexagram.name} 评分：${r.rating.score}（${r.rating.label}）`)
  parts.push('')
  if (pw?.oneLiner) { parts.push('【一句话】'); parts.push(pw.oneLiner); parts.push('') }
  if (rw) {
    parts.push('【现实白话】')
    parts.push(rw.headline)
    parts.push(`现在：${rw.currentSituation}`)
    if (rw.howToAct.length) parts.push(`怎么做：${rw.howToAct.join('；')}`)
    if (rw.watchOutFor.length) parts.push(`留心：${rw.watchOutFor.join('；')}`)
    parts.push('')
  }
  if (d) {
    parts.push('【传统解读】')
    parts.push(`${d.base.title}：${d.base.plainExplanation}`)
    parts.push(`综合：${d.synthesis}`)
  }
  parts.push('\n传统文化研究与娱乐参考，不预测未来、不替你做决定。本机离线计算，不联网、不调用 AI。')
  navigator.clipboard.writeText(parts.join('\n')).then(() => alert('已复制'))
}
</script>

<style scoped>
.title-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin: 14px 16px 6px; }
.title-row h1 { margin: 0; font-size: 24px; display: flex; align-items: center; gap: 8px; }
.gua-unicode { font-size: 26px; }
.reality-note {
  margin-top: 12px; padding: 10px 12px; border-radius: 10px;
  background: var(--paper-2); border-left: 3px solid var(--cinnabar);
  font-size: 14px; color: var(--ink-soft);
}
.pro-fold :deep(.card) { margin-left: 0; margin-right: 0; box-shadow: none; }
.classic-flow { margin-top: 12px; }
</style>

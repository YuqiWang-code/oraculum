<template>
  <div v-if="loading" class="card muted">加载中...</div>

  <div v-else-if="notFound" class="card">
    <h2>记录不存在</h2>
    <p>未找到该卦象记录，可能已被删除。</p>
    <button class="btn" @click="$router.push('/')">返回首页</button>
  </div>

  <template v-else-if="rec">
    <div class="title-row">
      <h1>
        <span v-if="rec.meihua">{{ rec.meihua.ben.unicode }} {{ rec.meihua.ben.name }}</span>
        <span v-else>{{ rec.liuyao?.hexagram.unicode }} {{ rec.liuyao?.hexagram.name }}</span>
      </h1>
      <div class="rating-header">
        <span :class="labelClass(rec.rating.label)">{{ rec.rating.label }} {{ rec.rating.score }}</span>
      </div>
    </div>

    <!-- 1. 本次所问 -->
    <div class="card">
      <h2>本次所问</h2>
      <div>{{ rec.input.question }}</div>
      <div class="muted">类别：{{ rec.input.category }} {{ rec.input.querentAlias || '未署名' }}</div>
    </div>

    <!-- 2. 一句话看懂（白话层） -->
    <div class="card" v-if="showPlain && plain" style="border-color:var(--accent)">
      <h2>
        一句话看懂
        <span class="plain-tag">白话</span>
      </h2>
      <p class="plain-oneliner">{{ plain.oneLiner }}</p>
      <details>
        <summary>为什么这么说？</summary>
        <div v-for="r in plain.reasons" :key="r.id" class="plain-reason">
          <span class="plain-reason-label">{{ r.label }}</span>
          <span>{{ r.explanation }}</span>
        </div>
        <div v-if="plain.realityGuard" class="plain-reason plain-reality">
          <span class="plain-reason-label">现实提醒</span>
          <span>{{ plain.realityGuard }}</span>
        </div>
        <div class="muted plain-disclaimer">{{ plain.disclaimer }}</div>
      </details>
    </div>

    <!-- 3. 现实白话解读（新增，长辈友好，默认展开） -->
    <div class="card rw-card" v-if="elderLoading && !realWorldReading" style="border-color:var(--accent)">
      <h2>现实白话解读</h2>
      <p class="muted" style="margin:8px 0">正在整理本地白话解读…</p>
    </div>

    <div class="card rw-card" v-if="realWorldReading" style="border-color:var(--accent)">
      <h2>现实白话解读</h2>
      <div class="rw-headline">{{ realWorldReading.headline }}</div>

      <div class="rw-section">
        <div class="rw-subhead">现在是什么情况</div>
        <p class="rw-body">{{ realWorldReading.currentSituation }}</p>
      </div>

      <div class="rw-section">
        <div class="rw-subhead">为什么这么看</div>
        <div class="rw-why" v-if="realWorldReading.why.base">
          <span class="rw-why-label">本卦</span>{{ realWorldReading.why.base }}
        </div>
        <div class="rw-why" v-for="(m, i) in realWorldReading.why.moving" :key="'wm' + i">
          <span class="rw-why-label">动爻</span>{{ m }}
        </div>
        <div class="rw-why" v-if="realWorldReading.why.mutual">
          <span class="rw-why-label">互卦</span>{{ realWorldReading.why.mutual }}
        </div>
        <div class="rw-why" v-if="realWorldReading.why.changed">
          <span class="rw-why-label">变卦</span>{{ realWorldReading.why.changed }}
        </div>
        <div class="rw-why" v-if="realWorldReading.why.bodyUse">
          <span class="rw-why-label">体用</span>{{ realWorldReading.why.bodyUse }}
        </div>
        <div class="rw-why" v-if="realWorldReading.why.rating">
          <span class="rw-why-label">评分</span>{{ realWorldReading.why.rating }}
        </div>
      </div>

      <div class="rw-section" v-if="realWorldReading.howToAct.length">
        <div class="rw-subhead">接下来怎么做</div>
        <ol class="rw-act">
          <li v-for="(a, i) in realWorldReading.howToAct" :key="'act' + i">{{ a }}</li>
        </ol>
      </div>

      <div class="rw-section" v-if="realWorldReading.watchOutFor.length">
        <div class="rw-subhead">最需要注意</div>
        <ul class="rw-watch">
          <li v-for="(w, i) in realWorldReading.watchOutFor" :key="'watch' + i">{{ w }}</li>
        </ul>
      </div>

      <div class="muted rw-disclaimer">{{ realWorldReading.disclaimer }}</div>
    </div>

    <!-- 4. 卦象 -->
    <div class="card" v-if="rec.meihua">
      <h2>卦象</h2>
      <div style="display:flex;gap:16px">
        <div style="flex:1">
          <div class="muted">本卦</div>
          <hexagram-diagram :lines="rec.meihua.ben.lines" :moving="true" :moving-index0="rec.meihua.movingIndex0" />
          <div class="muted">上{{ rec.meihua.ben.upper }} / 下{{ rec.meihua.ben.lower }}（体{{ rec.meihua.tiTrigram }}·用{{ rec.meihua.yongTrigram }}）</div>
        </div>
        <div style="flex:1">
          <div class="muted">变卦</div>
          <hexagram-diagram :lines="rec.meihua.bian.lines" />
          <div class="muted">{{ rec.meihua.bian.name }}</div>
        </div>
      </div>
      <div class="muted">互卦：{{ rec.meihua.hu.name }} 动爻：第{{ rec.meihua.movingLine }}爻</div>
    </div>

    <div class="card" v-if="rec.liuyao">
      <h2>六爻排盘</h2>
      <div v-for="l in rec.liuyao.lines" :key="l.index" style="display:flex;justify-content:space-between;font-size:14px;padding:3px 0;border-bottom:1px dashed var(--line)">
        <span>{{ l.index }}爻 {{ l.yinYang ? '阳' : '阴' }}{{ l.moving ? ' ○动' : '' }}</span>
        <span>{{ l.sixSpirit }} {{ l.branch }}{{ l.branchElement }} {{ l.sixRelation }}{{ l.isShi ? ' 世' : '' }}{{ l.isYing ? ' 应' : '' }}</span>
      </div>
      <div class="muted" v-if="rec.liuyao.shensha.length">神煞：{{ rec.liuyao.shensha.map(s=>`${s.name}${s.branch}`).join('、') }}</div>
    </div>

    <!-- 5. 传统综合解读（研究模式完整显示） -->
    <template v-if="isResearch && detailed">
      <div class="card" style="border-color:var(--accent)">
        <h2>传统综合解读</h2>
        <p class="muted" style="margin:0">{{ detailed.overview }}</p>
      </div>

      <div class="card" style="border-color:var(--accent)">
        <h2>综合解读</h2>
        <p style="white-space:pre-wrap;margin:0">{{ detailed.synthesis }}</p>
      </div>

      <div class="card" v-if="detailed.favorable.length">
        <h2>有利信号</h2>
        <div v-for="(f,i) in detailed.favorable" :key="'fav'+i" class="label-good" style="margin:4px 0">+ {{ f }}</div>
      </div>

      <div class="card" v-if="detailed.constraints.length">
        <h2>制约信号</h2>
        <div v-for="(c,i) in detailed.constraints" :key="'con'+i" class="label-bad" style="margin:4px 0">− {{ c }}</div>
      </div>
    </template>

    <!-- 6. 传统分项（研究模式完整显示） -->
    <template v-if="isResearch && detailed">
      <!-- 本卦 -->
      <div class="card">
        <h2>{{ detailed.base.title }}</h2>
        <details class="classic-details">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.base.classicTexts" :key="ct.label" class="classic-text">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div class="explain-block">
          <div class="explain-label">人话解释</div>
          <div class="explain-text">{{ detailed.base.plainExplanation }}</div>
        </div>
        <div class="explain-block">
          <div class="explain-label">放到你这个问题里</div>
          <div class="explain-text">{{ detailed.base.roleExplanation }}</div>
        </div>
      </div>

      <!-- 动爻 -->
      <div class="card" v-for="(ml, i) in detailed.movingLines" :key="'ml'+i">
        <h2>{{ ml.title }}</h2>
        <details class="classic-details">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in ml.classicTexts" :key="ct.label" class="classic-text">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div class="explain-block">
          <div class="explain-label">人话解释</div>
          <div class="explain-text">{{ ml.plainExplanation }}</div>
        </div>
        <div class="explain-block">
          <div class="explain-label">放到你这个问题里</div>
          <div class="explain-text">{{ ml.roleExplanation }}</div>
        </div>
      </div>

      <!-- 互卦（梅花用） -->
      <div class="card" v-if="detailed.mutual">
        <h2>{{ detailed.mutual.title }}</h2>
        <details class="classic-details">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.mutual.classicTexts" :key="ct.label" class="classic-text">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div class="explain-block">
          <div class="explain-label">人话解释</div>
          <div class="explain-text">{{ detailed.mutual.plainExplanation }}</div>
        </div>
        <div class="explain-block">
          <div class="explain-label">放到你这个问题里</div>
          <div class="explain-text">{{ detailed.mutual.roleExplanation }}</div>
        </div>
      </div>

      <!-- 变卦 -->
      <div class="card" v-if="detailed.changed">
        <h2>{{ detailed.changed.title }}</h2>
        <details class="classic-details">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.changed.classicTexts" :key="ct.label" class="classic-text">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div class="explain-block">
          <div class="explain-label">人话解释</div>
          <div class="explain-text">{{ detailed.changed.plainExplanation }}</div>
        </div>
        <div class="explain-block">
          <div class="explain-label">放到你这个问题里</div>
          <div class="explain-text">{{ detailed.changed.roleExplanation }}</div>
        </div>
      </div>

      <!-- 体用（梅花用） -->
      <div class="card" v-if="detailed.bodyUse">
        <h2>{{ detailed.bodyUse.title }}</h2>
        <details class="classic-details">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.bodyUse.classicTexts" :key="ct.label" class="classic-text">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div class="explain-block">
          <div class="explain-label">人话解释</div>
          <div class="explain-text">{{ detailed.bodyUse.plainExplanation }}</div>
        </div>
        <div class="explain-block">
          <div class="explain-label">放到你这个问题里</div>
          <div class="explain-text">{{ detailed.bodyUse.roleExplanation }}</div>
        </div>
      </div>
    </template>

    <!-- 7. 评分 -->
    <div class="card">
      <h2>传统评分（{{ rec.rating.score }} 分 · 一致性 {{ Math.round(rec.rating.consistency*100) }}%）</h2>
      <div class="muted" style="margin-bottom:8px">标签：{{ rec.rating.label }} 有利{{ rec.rating.favorableCount }}条 / 制约{{ rec.rating.constraintCount }}条</div>
      <details>
        <summary>查看评分依据</summary>
        <div v-for="e in rec.rating.evidence" :key="e.id" style="font-size:13px;margin:6px 0">
          <span :class="e.delta>=0?'label-good':'label-bad'">{{ e.delta>0?'+':'' }}{{ e.delta }}</span>
          {{ e.title }} — {{ e.reason }}
          <div class="muted">规则：{{ e.sourceRule }}<span v-if="e.bucket"> 分类：{{ bucketLabel(e.bucket) }}</span></div>
        </div>
      </details>
    </div>

    <!-- 六爻规则状态（仅六爻，研究模式） -->
    <div class="card" v-if="isResearch && rec.liuyao">
      <h2>六爻规则状态</h2>
      <div v-if="detailed?.usefulGodReason" style="margin-bottom:6px">{{ detailed.usefulGodReason }}</div>
      <div v-if="rec.liuyao" class="muted" style="margin-bottom:6px">
        本宫：{{ rec.liuyao.palace }}宫（{{ rec.liuyao.palaceElement }}） 世爻第{{ rec.liuyao.shiLine }}爻 应爻第{{ rec.liuyao.yingLine }}爻
      </div>
      <details v-if="breakdownEntries.length">
        <summary>查看评分分类明细</summary>
        <div v-for="e in breakdownEntries" :key="e.key" style="font-size:13px;margin:4px 0">
          <span :class="e.value > 0 ? 'label-good' : 'label-bad'">
            {{ e.value > 0 ? '+' : '' }}{{ e.value }}
          </span>
          {{ e.label }}
        </div>
      </details>
    </div>

    <!-- 8. 经典证据（简明模式折叠，研究模式展开） -->
    <div class="card" v-if="rec.classicEvidence && rec.classicEvidence.length">
      <h2>经典证据</h2>
      <details v-if="!isResearch">
        <summary>展开经典证据</summary>
        <div v-for="ev in rec.classicEvidence" :key="ev.id" style="margin:6px 0;font-size:14px">
          <div class="muted">{{ ev.hexagramName }}{{ ev.lineIndex > 0 ? ` · 第${ev.lineIndex}爻` : ' · 卦辞' }}</div>
          <div style="white-space:pre-wrap">{{ ev.original }}</div>
          <div class="muted" style="font-size:11px">{{ ev.source }}</div>
        </div>
      </details>
      <template v-else>
        <div v-for="ev in rec.classicEvidence" :key="ev.id" style="margin:6px 0;font-size:14px">
          <div class="muted">{{ ev.hexagramName }}{{ ev.lineIndex > 0 ? ` · 第${ev.lineIndex}爻` : ' · 卦辞' }}</div>
          <div style="white-space:pre-wrap">{{ ev.original }}</div>
          <div class="muted" style="font-size:11px">{{ ev.source }}</div>
        </div>
      </template>
    </div>

    <!-- 9. 起卦依据 -->
    <div class="card" v-if="rec.castingEvidence && rec.castingEvidence.length">
      <h2>起卦依据</h2>
      <div v-for="(ev, i) in rec.castingEvidence" :key="i" style="font-size:14px">
        <div class="muted">{{ sourceName(ev.source) }} · {{ ev.ruleVersion }}</div>
        <div style="white-space:pre-wrap">{{ ev.explanation }}</div>
        <details v-if="rec.sixSource" style="margin-top:6px">
          <summary>六源合参 canonical / hash</summary>
          <div class="muted" style="word-break:break-all;font-size:12px">{{ rec.sixSource.canonical }}</div>
          <div class="muted">H1={{ rec.sixSource.h1 }} H2={{ rec.sixSource.h2 }} H3={{ rec.sixSource.h3 }}</div>
        </details>
      </div>
    </div>

    <!-- 起卦信息（历法元数据） -->
    <div class="card">
      <h2>起卦信息</h2>
      <div class="muted">
        起卦时刻：{{ castTimeText }}<br/>
        {{ rec.calendar.lunarDate }} {{ rec.calendar.yearGanzhi }}年 {{ rec.calendar.monthGanzhi }}月
        {{ rec.calendar.dayGanzhi }}日 {{ rec.calendar.hourGanzhi }}时<br/>
        节气：{{ rec.calendar.solarTerm }} 月建：{{ rec.calendar.monthBranch }} 旬空：{{ rec.calendar.xunKong.join('、') }}<br/>
        起卦规则：{{ rec.castingRuleVersion || rec.ruleVersion }}<br/>
        规则版本：{{ rec.ruleVersion }} / 数据集：{{ rec.datasetVersion }}
      </div>
    </div>

    <!-- 现实行动提示（研究模式） -->
    <div class="card" v-if="isResearch && detailed && detailed.actionTips.length">
      <h2>现实行动提示</h2>
      <div v-for="(t,i) in detailed.actionTips" :key="'tip'+i" style="margin:4px 0">· {{ t }}</div>
    </div>

    <button class="btn" @click="copyText">复制文字结果</button>
    <button class="btn secondary" @click="$router.push('/')">返回首页</button>

    <div class="card muted">
      免责声明：传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。所有解读均来自本地经典数据与确定性规则引擎，不调用大模型。
    </div>
  </template>
  <div v-else class="card muted">尚无结果，请先去问卦。</div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import HexagramDiagram from '../components/hexagram/HexagramDiagram.vue'
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
import type { RatingBucket } from '../types'

const route = useRoute()
const store = useAppStore()

/** v4.3 现实白话解读可能已随记录持久化；旧记录无此字段，就地 fallback 生成。 */
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

/** 本地确定性解读——根据梅花/六爻分支调用对应组合器 */
const detailed = computed<LocalDetailedInterpretation | undefined>(() => {
  const r = rec.value
  if (!r) return undefined
  if (r.meihua) {
    return composeMeihuaInterpretation(r.meihua, r.rating, r.input.category)
  }
  if (r.liuyao) {
    return composeLiuyaoInterpretation(r.liuyao, r.rating, r.input.category, r.calendar.monthBranch, r.calendar.dayGanzhi)
  }
  return undefined
})

/**
 * 「一句话看懂」白话解读。
 * 旧记录若无 plainInterpretation 字段，就地用已有数据生成 fallback（只读，不重算卦）。
 */
const plain = computed<PlainInterpretation | undefined>(() => {
  const r = rec.value
  if (!r) return undefined
  if (r.plainInterpretation) return r.plainInterpretation
  try {
    if (r.meihua) {
      return interpretMeihuaPlain(r.input.question, r.input.category, r.meihua, r.rating)
    }
    if (r.liuyao) {
      return interpretLiuyaoPlain(
        r.input.question,
        r.input.category,
        r.liuyao,
        r.rating,
        r.calendar.monthBranch,
        r.calendar.dayGanzhi
      )
    }
  } catch {
    return undefined
  }
  return undefined
})

/**
 * 「现实白话解读」——v4.3 长辈友好层。
 * v4.4：长辈友好数据已改为动态分批加载。本卦/互卦/变卦所需批次就绪后再生成；
 * 旧记录优先用已持久化的 realWorldReading，否则就地生成（只读，不重起卦、不改评分）。
 */
const elderLoading = ref(false)
const realWorldReading = shallowRef<RealWorldPlainReading | undefined>(undefined)

/** 收集记录中涉及的所有 kingWen（本/互/变卦），用于按需加载长辈友好批次 */
function collectKingWens(r: RecordWithRealWorld): number[] {
  const kws: number[] = []
  if (r.meihua) {
    kws.push(r.meihua.ben.kingWen, r.meihua.hu.kingWen, r.meihua.bian.kingWen)
  }
  if (r.liuyao) {
    kws.push(r.liuyao.hexagram.kingWen)
    if (r.liuyao.changedHexagram) kws.push(r.liuyao.changedHexagram.kingWen)
  }
  return kws
}

async function loadRealWorldForRecord(r: RecordWithRealWorld): Promise<void> {
  // 已持久化的现实白话直接用，不必等 elder 批次
  if (r.realWorldReading) {
    realWorldReading.value = r.realWorldReading
  }
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
          r.input.question,
          r.input.category,
          r.liuyao,
          r.rating,
          r.calendar.monthBranch,
          r.calendar.dayGanzhi
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

/**
 * 阅读模式：simple（默认）/ research。
 * 兼容旧 resultDisplayMode：未设置 readingMode 时，detailed_only 视为 research。
 */
const readingMode = computed<'simple' | 'research'>(() => {
  const s = store.settings
  if (s.readingMode) return s.readingMode
  if (s.resultDisplayMode === 'detailed_only') return 'research'
  return 'simple'
})

const isResearch = computed(() => readingMode.value === 'research')

/** 简明模式才显示「一句话看懂」卡片（研究模式聚焦传统详解，与旧 detailed_only 行为一致） */
const showPlain = computed(() => !isResearch.value)

/** RatingBucket 中文名 */
const BUCKET_LABELS: Record<RatingBucket, string> = {
  usefulGod: '用神旺衰',
  sourceTaboo: '来源禁忌',
  shiYing: '世应关系',
  monthDay: '月建日辰',
  movement: '动爻变化',
  conflictHarmony: '冲合关系',
  classicTheme: '卦象主题',
  auxiliary: '辅助神煞'
}

function bucketLabel(b: RatingBucket): string {
  return BUCKET_LABELS[b] || b
}

/** RatingBreakdown 分类名映射 */
const BREAKDOWN_LABEL_MAP: Record<string, string> = {
  usefulGod: '用神旺衰',
  sourceTaboo: '元神忌神',
  shiYing: '世应关系',
  monthDay: '月建日辰',
  movement: '动爻变化',
  conflictHarmony: '冲合关系',
  classicTheme: '卦象主题',
  auxiliary: '辅助神煞'
}

/** RatingBreakdown 明细条目（过滤掉 0 值） */
const breakdownEntries = computed(() => {
  const bd = rec.value?.rating.breakdown
  if (!bd) return [] as { key: string; value: number; label: string }[]
  return Object.entries(bd)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({
      key: k,
      value: v,
      label: BREAKDOWN_LABEL_MAP[k] || k
    }))
})

const castTimeText = computed(() => {
  if (!rec.value) return ''
  const tz = rec.value.input.timezone
  const text = new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(rec.value.input.castTime))
  return `${text}（${tz}）`
})

function sourceName(s: string) {
  return { time: '时间', random: '随机数', dice: '骰子', coins: '三枚钱', text: '文字', omen: '外应' }[s] || s
}

function labelClass(l: string) {
  return l === '大吉' || l === '吉' ? 'label-good' : l === '大凶' || l === '凶' ? 'label-bad' : 'label-flat'
}

function copyText() {
  if (!rec.value) return
  const r = rec.value
  const d = detailed.value
  const pw = plain.value
  const rw = realWorldReading.value

  const parts: string[] = []
  parts.push(`【智能推理与预测】`)
  parts.push(`所问：${r.input.question}（${r.input.category}）`)
  parts.push(`卦：${r.meihua?.ben.name ?? r.liuyao?.hexagram.name} 评分：${r.rating.score}（${r.rating.label}）`)
  parts.push(`历法：${r.calendar.lunarDate} ${r.calendar.dayGanzhi}日`)
  parts.push('')

  // 最前面：一句话看懂
  if (pw?.oneLiner) {
    parts.push(`【一句话看懂】`)
    parts.push(pw.oneLiner)
    parts.push('')
  }

  // 现实白话：现在 / 为什么 / 怎么做 / 注意
  if (rw) {
    parts.push(`【现实白话】`)
    if (rw.headline) parts.push(rw.headline)
    if (rw.currentSituation) parts.push(`现在：${rw.currentSituation}`)
    const whyLines: string[] = []
    if (rw.why.base) whyLines.push(`本卦 ${rw.why.base}`)
    for (const m of rw.why.moving) whyLines.push(`动爻 ${m}`)
    if (rw.why.mutual) whyLines.push(`互卦 ${rw.why.mutual}`)
    if (rw.why.changed) whyLines.push(`变卦 ${rw.why.changed}`)
    if (rw.why.bodyUse) whyLines.push(`体用 ${rw.why.bodyUse}`)
    if (rw.why.rating) whyLines.push(`评分 ${rw.why.rating}`)
    if (whyLines.length) parts.push(`为什么：${whyLines.join('；')}`)
    if (rw.howToAct.length) parts.push(`怎么做：${rw.howToAct.join('；')}`)
    const watch = [...rw.watchOutFor]
    if (rw.realityGuard) watch.push(rw.realityGuard)
    if (watch.length) parts.push(`注意：${watch.join('；')}`)
    parts.push('')
  }

  // 传统详细内容放后面
  if (d) {
    parts.push(`【传统解读】`)
    parts.push(`【核心解读】\n${d.overview}\n\n${d.base.title}\n${d.base.plainExplanation}`)
    if (d.mutual) parts.push(`互卦：${d.mutual.title}\n${d.mutual.plainExplanation}`)
    if (d.changed) parts.push(`变卦：${d.changed.title}\n${d.changed.plainExplanation}`)
    parts.push(`\n【综合】\n${d.synthesis}`)
    if (d.favorable.length) parts.push(`有利：${d.favorable.join('；')}`)
    if (d.constraints.length) parts.push(`制约：${d.constraints.join('；')}`)
    if (d.actionTips.length) parts.push(`提示：${d.actionTips.join('；')}`)
  }

  parts.push('\n免责：传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。')
  navigator.clipboard.writeText(parts.join('\n')).then(() => alert('已复制'))
}
</script>

<style scoped>
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 18px 16px;
}
.title-row h1 { margin: 0; }
.rating-header { white-space: nowrap; }

.plain-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: normal;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted, #888);
  vertical-align: middle;
}
.plain-oneliner {
  font-size: 19px;
  line-height: 1.7;
  margin: 8px 0 4px;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.plain-reason {
  font-size: 14px;
  margin: 6px 0;
  line-height: 1.6;
}
.plain-reason-label {
  display: inline-block;
  margin-right: 6px;
  font-weight: 600;
}
.plain-reality { color: var(--accent, #888); }
.plain-disclaimer { margin-top: 10px; font-size: 12px; }

/* ===== 现实白话解读（长辈友好） ===== */
.rw-card {
  word-break: break-word;
  overflow-wrap: anywhere;
}
.rw-headline {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.75;
  margin: 8px 0 4px;
  word-break: break-word;
}
.rw-section { margin-top: 12px; }
.rw-subhead {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.7;
  margin: 10px 0 4px;
}
.rw-body {
  font-size: 18px;
  line-height: 1.85;
  margin: 0;
  word-break: break-word;
}
.rw-why {
  font-size: 18px;
  line-height: 1.85;
  margin: 6px 0;
  word-break: break-word;
}
.rw-why-label {
  display: inline-block;
  margin-right: 6px;
  font-weight: 700;
}
.rw-act {
  font-size: 18px;
  line-height: 1.85;
  padding-left: 1.4em;
  margin: 4px 0;
}
.rw-act li {
  margin: 4px 0;
  word-break: break-word;
}
.rw-watch {
  font-size: 18px;
  line-height: 1.85;
  padding-left: 1.4em;
  margin: 4px 0;
}
.rw-watch li {
  margin: 4px 0;
  word-break: break-word;
}
.rw-disclaimer {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
}

/* ===== 传统分项：人话解释 / 放到你这个问题里（比原文醒目） ===== */
.classic-details { margin: 8px 0; }
.classic-text { margin: 8px 0; }
.explain-block { margin-top: 10px; }
.explain-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 2px;
}
.explain-text {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.75;
  word-break: break-word;
}
</style>

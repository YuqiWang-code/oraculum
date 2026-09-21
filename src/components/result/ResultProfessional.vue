<template>
  <div v-if="rec">
    <!-- 卦象图 -->
    <div class="card" v-if="rec.meihua">
      <h2>
        卦象
        <TermHelp term="本卦" depth="research" />
      </h2>
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
      <div class="muted">
        互卦：{{ rec.meihua.hu.name }}，动爻：第{{ rec.meihua.movingLine }}爻
      </div>
    </div>

    <div class="card" v-if="rec.liuyao">
      <h2>六爻排盘 <TermHelp term="六爻纳甲" depth="research" /></h2>
      <div v-for="l in rec.liuyao.lines" :key="l.index" style="display:flex;justify-content:space-between;font-size:14px;padding:3px 0;border-bottom:1px dashed var(--line);gap:6px">
        <span>{{ l.index }}爻 {{ l.yinYang ? '阳' : '阴' }}{{ l.moving ? ' ○动' : '' }}</span>
        <span>{{ l.sixSpirit }} {{ l.branch }}{{ l.branchElement }} {{ l.sixRelation }}{{ l.isShi ? ' 世' : '' }}{{ l.isYing ? ' 应' : '' }}</span>
      </div>
      <div class="muted" style="margin-top:6px">
        本宫：{{ rec.liuyao.palace }}宫（{{ rec.liuyao.palaceElement }}）
        世爻第{{ rec.liuyao.shiLine }}爻 应爻第{{ rec.liuyao.yingLine }}爻
      </div>
      <div class="muted" v-if="rec.liuyao.shensha.length">
        神煞：{{ rec.liuyao.shensha.map((s: any) => `${s.name}${s.branch}`).join('、') }}
      </div>
    </div>

    <!-- 传统综合解读 -->
    <div class="card" v-if="detailed">
      <h2>传统综合解读</h2>
      <p class="muted" style="margin:0">{{ detailed.overview }}</p>
      <p style="white-space:pre-wrap;margin:10px 0 0">{{ detailed.synthesis }}</p>
    </div>

    <div class="card" v-if="detailed && detailed.favorable.length">
      <h2>有利信号</h2>
      <div v-for="(f,i) in detailed.favorable" :key="'fav'+i" class="label-good" style="margin:4px 0">+ {{ f }}</div>
    </div>
    <div class="card" v-if="detailed && detailed.constraints.length">
      <h2>制约信号</h2>
      <div v-for="(c,i) in detailed.constraints" :key="'con'+i" class="label-bad" style="margin:4px 0">− {{ c }}</div>
    </div>

    <!-- 分项：本卦 / 动爻 / 互卦 / 变卦 / 体用 -->
    <template v-if="detailed">
      <div class="card" v-for="sec in sections" :key="sec.key">
        <h2>
          {{ sec.title }}
          <TermHelp v-if="sec.term" :term="sec.term" depth="research" />
        </h2>
        <details class="classic-details" open>
          <summary>《周易》原文</summary>
          <div v-for="ct in sec.classicTexts" :key="ct.label" class="classic-text">
            <div class="muted">{{ ct.label }}</div>
            <div class="classic-text" style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div class="explain-block">
          <div class="explain-label">现代解释</div>
          <div class="explain-text">{{ sec.plainExplanation }}</div>
        </div>
        <div class="explain-block">
          <div class="explain-label">放到你这个问题里</div>
          <div class="explain-text">{{ sec.roleExplanation }}</div>
        </div>
      </div>
    </template>

    <!-- 专业备注（来自现实白话引擎的术语证据） -->
    <div class="card" v-if="rw && rw.professionalNotes && rw.professionalNotes.length">
      <h2>术语化参考依据</h2>
      <div v-for="(n, i) in rw.professionalNotes" :key="'pn'+i" style="font-size:13px;margin:5px 0;color:var(--ink-soft)">· {{ n }}</div>
    </div>

    <!-- 评分 -->
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
      <details v-if="breakdownEntries.length" style="margin-top:8px">
        <summary>评分分类明细</summary>
        <div v-for="e in breakdownEntries" :key="e.key" style="font-size:13px;margin:4px 0">
          <span :class="e.value > 0 ? 'label-good' : 'label-bad'">{{ e.value > 0 ? '+' : '' }}{{ e.value }}</span>
          {{ e.label }}
        </div>
      </details>
    </div>

    <!-- 六爻规则状态 -->
    <div class="card" v-if="rec.liuyao && detailed?.usefulGodReason">
      <h2>六爻规则状态</h2>
      <div style="margin-bottom:6px">{{ detailed.usefulGodReason }}</div>
    </div>

    <!-- 经典证据 -->
    <div class="card" v-if="rec.classicEvidence && rec.classicEvidence.length">
      <h2>经典证据</h2>
      <div v-for="ev in rec.classicEvidence" :key="ev.id" style="margin:8px 0;font-size:14px">
        <div class="muted">{{ ev.hexagramName }}{{ ev.lineIndex > 0 ? ` · 第${ev.lineIndex}爻` : ' · 卦辞' }}</div>
        <div class="classic-text" style="white-space:pre-wrap">{{ ev.original }}</div>
        <div class="muted" style="font-size:11px">{{ ev.source }}</div>
      </div>
    </div>

    <!-- 起卦依据 -->
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

    <!-- 起卦信息 -->
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

    <div class="card" v-if="detailed && detailed.actionTips.length">
      <h2>现实行动提示</h2>
      <div v-for="(t,i) in detailed.actionTips" :key="'tip'+i" style="margin:4px 0">· {{ t }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HexagramDiagram from '../hexagram/HexagramDiagram.vue'
import TermHelp from '../common/TermHelp.vue'
import type { DivinationRecord } from '../../engine/orchestrator'
import type { LocalDetailedInterpretation } from '../../engine/localInterpretation/types'
import type { RealWorldPlainReading } from '../../engine/realWorldInterpretation'
import type { RatingBucket } from '../../types'

const props = defineProps<{
  rec: DivinationRecord
  detailed?: LocalDetailedInterpretation
  rw?: RealWorldPlainReading
}>()

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

const breakdownEntries = computed(() => {
  const bd = props.rec.rating.breakdown
  if (!bd) return [] as { key: string; value: number; label: string }[]
  return Object.entries(bd)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({ key: k, value: v as number, label: BREAKDOWN_LABEL_MAP[k] || k }))
})

const castTimeText = computed(() => {
  const tz = props.rec.input.timezone
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(props.rec.input.castTime)) + `（${tz}）`
})

function sourceName(s: string) {
  return { time: '时间', random: '随机数', dice: '骰子', coins: '三枚钱', text: '文字', omen: '外应' }[s] || s
}

interface Section {
  key: string
  title: string
  term?: string
  classicTexts: { label: string; text: string; source: string }[]
  plainExplanation: string
  roleExplanation: string
}

const sections = computed<Section[]>(() => {
  const d = props.detailed
  if (!d) return []
  const out: Section[] = []
  const push = (key: string, s: any, term?: string) => {
    if (s) out.push({ key, title: s.title, term, classicTexts: s.classicTexts || [], plainExplanation: s.plainExplanation, roleExplanation: s.roleExplanation })
  }
  push('base', d.base, '本卦')
  for (const m of d.movingLines || []) push('ml' + m.title, m, '动爻')
  push('mutual', d.mutual, '互卦')
  push('changed', d.changed, '变卦')
  push('bodyUse', d.bodyUse, '体用')
  return out
})
</script>

<style scoped>
.classic-details { margin: 8px 0; }
.explain-block { margin-top: 10px; }
.explain-label { font-size: 14px; font-weight: 700; color: var(--cinnabar); margin-bottom: 2px; }
.explain-text { font-size: 16px; font-weight: 600; line-height: 1.75; word-break: break-word; }
</style>

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

    <!-- 2. 卦象 -->
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

    <template v-if="detailed">
      <!-- 3. 综合解读（核心解读） -->
      <div class="card" style="border-color:var(--accent)">
        <h2>核心解读</h2>
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

      <!-- 4. 分项解读 -->
      <!-- 本卦 -->
      <div class="card">
        <h2>{{ detailed.base.title }}</h2>
        <details style="margin:8px 0">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.base.classicTexts" :key="ct.label" style="margin:8px 0">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div style="margin-top:8px"><b>白话：</b>{{ detailed.base.plainExplanation }}</div>
        <div style="margin-top:4px"><b>本次角色：</b>{{ detailed.base.roleExplanation }}</div>
      </div>

      <!-- 动爻 -->
      <div class="card" v-for="(ml, i) in detailed.movingLines" :key="'ml'+i">
        <h2>{{ ml.title }}</h2>
        <details style="margin:8px 0">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in ml.classicTexts" :key="ct.label" style="margin:8px 0">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div style="margin-top:8px"><b>白话：</b>{{ ml.plainExplanation }}</div>
        <div style="margin-top:4px"><b>本次角色：</b>{{ ml.roleExplanation }}</div>
      </div>

      <!-- 互卦（梅花用） -->
      <div class="card" v-if="detailed.mutual">
        <h2>{{ detailed.mutual.title }}</h2>
        <details style="margin:8px 0">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.mutual.classicTexts" :key="ct.label" style="margin:8px 0">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div style="margin-top:8px"><b>白话：</b>{{ detailed.mutual.plainExplanation }}</div>
        <div style="margin-top:4px"><b>本次角色：</b>{{ detailed.mutual.roleExplanation }}</div>
      </div>

      <!-- 变卦 -->
      <div class="card" v-if="detailed.changed">
        <h2>{{ detailed.changed.title }}</h2>
        <details style="margin:8px 0">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.changed.classicTexts" :key="ct.label" style="margin:8px 0">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div style="margin-top:8px"><b>白话：</b>{{ detailed.changed.plainExplanation }}</div>
        <div style="margin-top:4px"><b>本次角色：</b>{{ detailed.changed.roleExplanation }}</div>
      </div>

      <!-- 体用（梅花用） -->
      <div class="card" v-if="detailed.bodyUse">
        <h2>{{ detailed.bodyUse.title }}</h2>
        <details style="margin:8px 0">
          <summary>查看《周易》原文</summary>
          <div v-for="ct in detailed.bodyUse.classicTexts" :key="ct.label" style="margin:8px 0">
            <div class="muted">{{ ct.label }}</div>
            <div style="white-space:pre-wrap">{{ ct.text }}</div>
            <div class="muted" style="font-size:11px">{{ ct.source }}</div>
          </div>
        </details>
        <div style="margin-top:8px"><b>白话：</b>{{ detailed.bodyUse.plainExplanation }}</div>
        <div style="margin-top:4px"><b>本次角色：</b>{{ detailed.bodyUse.roleExplanation }}</div>
      </div>
    </template>

    <!-- 5. 传统评分 -->
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

    <!-- 6. 六爻规则状态（仅六爻） -->
    <div class="card" v-if="rec.liuyao">
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

    <!-- 7. 经典证据 -->
    <div class="card" v-if="rec.classicEvidence && rec.classicEvidence.length">
      <h2>经典证据</h2>
      <div v-for="ev in rec.classicEvidence" :key="ev.id" style="margin:6px 0;font-size:14px">
        <div class="muted">{{ ev.hexagramName }}{{ ev.lineIndex > 0 ? ` · 第${ev.lineIndex}爻` : ' · 卦辞' }}</div>
        <div style="white-space:pre-wrap">{{ ev.original }}</div>
        <div class="muted" style="font-size:11px">{{ ev.source }}</div>
      </div>
    </div>

    <!-- 8. 起卦依据 -->
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

    <!-- 9. 现实行动提示 -->
    <div class="card" v-if="detailed && detailed.actionTips.length">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import HexagramDiagram from '../components/hexagram/HexagramDiagram.vue'
import { getRecord } from '../db'
import { composeMeihuaInterpretation } from '../engine/localInterpretation/composeMeihuaInterpretation'
import { composeLiuyaoInterpretation } from '../engine/localInterpretation/composeLiuyaoInterpretation'
import type { LocalDetailedInterpretation } from '../engine/localInterpretation/types'
import type { DivinationRecord } from '../engine/orchestrator'
import type { RatingBucket } from '../types'

const route = useRoute()
const store = useAppStore()

const rec = ref<DivinationRecord | null>(null)
const loading = ref(true)
const notFound = ref(false)

async function load() {
  const id = String(route.params.id || '')
  if (store.lastResult && store.lastResult.id === id) {
    rec.value = store.lastResult
    loading.value = false
    notFound.value = false
    return
  }
  loading.value = true
  notFound.value = false
  const r = await getRecord(id)
  rec.value = r ?? null
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
  const txt = [
    `【智能推理与预测】`,
    `所问：${r.input.question}（${r.input.category}）`,
    `卦：${r.meihua?.ben.name ?? r.liuyao?.hexagram.name} 评分：${r.rating.score}（${r.rating.label}）`,
    `历法：${r.calendar.lunarDate} ${r.calendar.dayGanzhi}日`,
    '',
    d ? `【核心解读】\n${d.overview}\n\n${d.base.title}\n${d.base.plainExplanation}\n` : '',
    d?.mutual ? `互卦：${d.mutual.title}\n${d.mutual.plainExplanation}\n` : '',
    d?.changed ? `变卦：${d.changed.title}\n${d.changed.plainExplanation}\n` : '',
    d ? `\n【综合】\n${d.synthesis}\n` : '',
    d && d.favorable.length ? `\n有利：${d.favorable.join('；')}` : '',
    d && d.constraints.length ? `\n制约：${d.constraints.join('；')}` : '',
    d && d.actionTips.length ? `\n提示：${d.actionTips.join('；')}` : '',
    '\n免责：传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。'
  ].join('\n')
  navigator.clipboard.writeText(txt).then(() => alert('已复制'))
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
</style>

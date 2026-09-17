<template>
  <div v-if="rec">
    <h1>
      <span v-if="rec.meihua">{{ rec.meihua.ben.unicode }} {{ rec.meihua.ben.name }}</span>
      <span v-else>{{ rec.liuyao?.hexagram.unicode }} {{ rec.liuyao?.hexagram.name }}</span>
      <span :class="labelClass(rec.rating.label)" style="float:right">{{ rec.rating.label }} {{ rec.rating.score }}</span>
    </h1>

    <div class="card">
      <h2>本次所问</h2>
      <div>{{ rec.input.question }}</div>
      <div class="muted">类别：{{ rec.input.category }}　{{ rec.input.querentAlias || '未署名' }}</div>
    </div>

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
      <div class="muted">互卦：{{ rec.meihua.hu.name }}　动爻：第{{ rec.meihua.movingLine }}爻</div>
    </div>

    <div class="card" v-if="rec.liuyao">
      <h2>六爻排盘</h2>
      <div v-for="l in rec.liuyao.lines" :key="l.index" style="display:flex;justify-content:space-between;font-size:14px;padding:3px 0;border-bottom:1px dashed var(--line)">
        <span>{{ l.index }}爻 {{ l.yinYang ? '阳' : '阴' }}{{ l.moving ? '○动' : '' }}</span>
        <span>{{ l.sixSpirit }} {{ l.branch }}{{ l.branchElement }} {{ l.sixRelation }}{{ l.isShi ? ' 世' : '' }}{{ l.isYing ? ' 应' : '' }}</span>
      </div>
      <div class="muted" v-if="rec.usefulGodReason">{{ rec.usefulGodReason }}</div>
      <div class="muted" v-if="rec.liuyao.shensha.length">神煞：{{ rec.liuyao.shensha.map(s=>`${s.name}${s.branch}`).join('、') }}</div>
    </div>

    <div class="card">
      <h2>起卦信息</h2>
      <div class="muted">
        起卦时刻：{{ castTimeText }}<br/>
        {{ rec.calendar.lunarDate }}　{{ rec.calendar.yearGanzhi }}年 {{ rec.calendar.monthGanzhi }}月
        {{ rec.calendar.dayGanzhi }}日 {{ rec.calendar.hourGanzhi }}时<br/>
        节气：{{ rec.calendar.solarTerm }}　月建：{{ rec.calendar.monthBranch }}　旬空：{{ rec.calendar.xunKong.join('、') }}<br/>
        起卦规则：{{ rec.castingRuleVersion || rec.ruleVersion }}<br/>
        规则版本：{{ rec.ruleVersion }} / 数据集：{{ rec.datasetVersion }}
      </div>
    </div>

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

    <div class="card">
      <h2>经典卦辞</h2>
      <div v-if="judgment" style="white-space:pre-wrap">{{ judgment }}</div>
      <div class="muted">经典原文待联网逐字核验（见 docs/DATA_SOURCES.md）。主题关键词：{{ keywords }}</div>
    </div>

    <div class="card">
      <h2>核心解读</h2>
      <p>{{ rec.interpretation.summary }}</p>
      <p>{{ rec.interpretation.trend }}</p>
    </div>

    <div class="card">
      <h2>有利因素</h2>
      <div v-for="(f,i) in rec.interpretation.favorable" :key="i" class="label-good">+ {{ f }}</div>
    </div>

    <div class="card">
      <h2>制约因素</h2>
      <div v-for="(f,i) in rec.interpretation.constraints" :key="i" class="label-bad">− {{ f || '（无明显制约）' }}</div>
      <div v-if="!rec.interpretation.constraints.length" class="muted">无明显制约。</div>
    </div>

    <div class="card">
      <h2>现实行动提示</h2>
      <div v-for="(t,i) in rec.interpretation.actionTips" :key="i">· {{ t }}</div>
    </div>

    <div class="card">
      <h2>评分明细（{{ rec.rating.score }} 分 · 一致性 {{ Math.round(rec.rating.consistency*100) }}%）</h2>
      <details>
        <summary>查看评分依据</summary>
        <div v-for="e in rec.rating.evidence" :key="e.id" style="font-size:13px;margin:6px 0">
          <span :class="e.delta>=0?'label-good':'label-bad'">{{ e.delta>0?'+':'' }}{{ e.delta }}</span>
          {{ e.title }} — {{ e.reason }}
          <div class="muted">规则：{{ e.sourceRule }}</div>
        </div>
      </details>
    </div>

    <button class="btn" @click="copyText">复制文字结果</button>
    <button class="btn secondary" @click="$router.push('/')">返回首页</button>

    <AiInterpretationCard :record="rec" />

    <div class="card muted">
      免责声明：传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。
    </div>
  </div>
  <div v-else class="card muted">尚无结果，请先去问卦。</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import HexagramDiagram from '../components/hexagram/HexagramDiagram.vue'
import AiInterpretationCard from '../components/ai/AiInterpretationCard.vue'

const store = useAppStore()
const rec = computed(() => store.lastResult)

const judgment = computed(() => rec.value?.meihua?.ben.judgmentClassic || rec.value?.liuyao?.hexagram.judgmentClassic || '')
const keywords = computed(() => (rec.value?.meihua?.ben || rec.value?.liuyao?.hexagram)?.editorialKeywords.join('、') || '')
const castTimeText = computed(() => {
  if (!rec.value) return ''
  return new Date(rec.value.input.castTime).toLocaleString('zh-CN', { hour12: false })
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
  const txt = [
    `【智能推理与预测】`,
    `所问：${r.input.question}（${r.input.category}）`,
    `卦：${r.meihua?.ben.name ?? r.liuyao?.hexagram.name}　评分：${r.rating.score}（${r.rating.label}）`,
    `历法：${r.calendar.lunarDate} ${r.calendar.dayGanzhi}日`,
    `解读：${r.interpretation.summary}`,
    `有利：${r.interpretation.favorable.join('；')}`,
    `制约：${r.interpretation.constraints.join('；')}`,
    '免责：传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。'
  ].join('\n')
  navigator.clipboard.writeText(txt).then(() => alert('已复制'))
}
</script>

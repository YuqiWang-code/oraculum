<template>
  <div>
    <h1>知识库</h1>
    <div class="card">
      <input v-model="kw" placeholder="搜索卦名/术语…" />
    </div>

    <div class="card" v-for="g in groups" :key="g.name">
      <h2>{{ g.name }}</h2>
      <div v-if="g.kind === 'gua'" v-for="h in filteredHex(g.items)" :key="h.kingWen" class="muted" style="margin:4px 0">
        {{ h.kingWen }}. {{ h.unicode }} {{ h.name }}（上{{ h.upper }}下{{ h.lower }}）
        <div style="padding-left:16px">关键词：{{ h.editorialKeywords.join('、') }}　宫：{{ h.palace }}</div>
      </div>
      <div v-else v-for="item in g.items" :key="item" class="muted">{{ item }}</div>
    </div>

    <div class="card muted">
      卦辞/爻辞经典原文待联网逐字核验；当前展示结构与编辑关键词，不冒充原文。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HEXAGRAMS } from '../data/hexagrams'
import { TRIGRAMS } from '../data/trigrams'

const kw = ref('')

const guaItems = HEXAGRAMS
interface TextGroup { name: string; kind: 'text'; items: string[] }
interface GuaGroup { name: string; kind: 'gua'; items: typeof HEXAGRAMS }
const groups: (TextGroup | GuaGroup)[] = [
  { name: '八卦', kind: 'text', items: Object.values(TRIGRAMS).map((t) => `${t.name}：先天数${t.xiantianNumber}，${t.element}，象：${t.images.join('、')}`) },
  { name: '六十四卦', kind: 'gua', items: guaItems },
  { name: '规则与来源', kind: 'text', items: [
    '梅花时间起卦规则版本：meihua_time_v1',
    '六爻纳甲/八宫/世应：v1（资料第6节）',
    '评分规则版本：1.0.0（资料第11节）',
    '神煞为低权重辅助，不单独定吉凶'
  ]}
]

function filteredHex(items: typeof HEXAGRAMS) {
  if (!kw.value) return items
  return items.filter((h) => h.name.includes(kw.value) || h.editorialKeywords.some((k) => k.includes(kw.value)))
}
</script>

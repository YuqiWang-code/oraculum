<template>
  <div>
    <h1>关于</h1>
    <div class="card">
      <h2>Oraculum v{{ av }}</h2>
      <p>一个移动端优先的传统文化问卦/解卦 PWA，支持梅花易数时间起卦与六爻纳甲排盘。</p>
      <p class="muted">规则版本：{{ rv }}　数据集版本：{{ dv }}</p>
    </div>
    <div class="card">
      <h2>免责声明</h2>
      <p>本应用用于传统文化研究、娱乐与自我反思，<strong>不代表客观事实或未来必然结果</strong>。</p>
      <p>涉及医疗、法律、财务、安全、升学就业等重要决定时，请以现实证据和专业意见为准，不以占卜结果替代决策。</p>
    </div>
    <div class="card">
      <h2>技术</h2>
      <p class="muted">Vue 3 + TypeScript + Vite + Pinia + Dexie。历法由 lunar-javascript 本地计算，规则引擎完全本地、确定性可复现。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { APP_VERSION, RULESET_VERSION, DATASET_VERSION } from '../types'
const rv = RULESET_VERSION
const dv = DATASET_VERSION
const av = APP_VERSION
</script>

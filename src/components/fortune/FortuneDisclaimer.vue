<template>
  <div class="card muted-box">
    <h2>说明与免责</h2>
    <ul class="disclaimer">
      <li>传统文化研究与参考；重要现实决定请依据事实和专业意见。</li>
      <li>所有计算均在本地完成，不上传任何数据。</li>
      <li>出生资料默认不保存，只有主动勾选才写入本地。</li>
    </ul>
    <div class="versions">
      <div>规则版本：{{ ruleset }}</div>
      <div>数据版本：{{ dataset }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FORTUNE_RULESET_VERSION, FORTUNE_DATASET_VERSION } from '../../engine/fortune'

const ruleset = FORTUNE_RULESET_VERSION
const dataset = FORTUNE_DATASET_VERSION
</script>

<style scoped>
.muted-box { background: var(--bg); }
.disclaimer {
  padding-left: 18px;
  margin: 6px 0;
  line-height: 1.7;
  font-size: 15px;
}
.disclaimer li { margin: 4px 0; }
.versions {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}
</style>

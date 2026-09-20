<template>
  <div class="card" v-if="overview">
    <h2>八字概览</h2>

    <!-- 四柱 -->
    <div class="pillars">
      <div class="pillar">
        <div class="pillar-label">年柱</div>
        <div class="pillar-gz">{{ overview.pillars.year }}</div>
      </div>
      <div class="pillar">
        <div class="pillar-label">月柱</div>
        <div class="pillar-gz">{{ overview.pillars.month }}</div>
      </div>
      <div class="pillar" v-if="overview.pillars.day">
        <div class="pillar-label">日柱</div>
        <div class="pillar-gz">{{ overview.pillars.day }}</div>
      </div>
      <div class="pillar" v-if="overview.pillars.hour">
        <div class="pillar-label">时柱</div>
        <div class="pillar-gz">{{ overview.pillars.hour }}</div>
      </div>
      <div class="pillar unknown" v-else-if="overview.precision === 'date'">
        <div class="pillar-label">时柱</div>
        <div class="pillar-gz">未知</div>
      </div>
    </div>

    <p class="muted note">{{ overview.precisionNote }}</p>

    <!-- 起运信息 -->
    <div class="qiyun" v-if="overview.qiYun">
      <h3>起运</h3>
      <div class="qiyun-row">
        <span>起运年龄</span><strong>{{ overview.qiYun.startAge }} 岁</strong>
      </div>
      <div class="qiyun-row">
        <span>起运公历</span><strong>{{ overview.qiYun.startDate }}</strong>
      </div>
      <div class="qiyun-row">
        <span>顺逆</span>
        <strong :class="overview.qiYun.direction === '顺' ? 'label-good' : 'label-bad'">
          {{ overview.qiYun.direction }}行
        </strong>
      </div>
    </div>

    <!-- 五行统计 -->
    <div class="section" v-if="overview.wuxingCount && hasWuxing">
      <h3>五行统计</h3>
      <div class="wx-row">
        <span v-for="(v, k) in overview.wuxingCount" :key="k" class="wx-chip">
          {{ wxLabel(k) }} × {{ v }}
        </span>
      </div>
    </div>

    <!-- 纳音 -->
    <div class="section" v-if="overview.nayin">
      <h3>纳音</h3>
      <div class="nayin">
        <div v-if="overview.nayin.year" class="nayin-line"><span>年</span>{{ overview.nayin.year }}</div>
        <div v-if="overview.nayin.month" class="nayin-line"><span>月</span>{{ overview.nayin.month }}</div>
        <div v-if="overview.nayin.day" class="nayin-line"><span>日</span>{{ overview.nayin.day }}</div>
        <div v-if="overview.nayin.hour" class="nayin-line"><span>时</span>{{ overview.nayin.hour }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BaziOverview } from '../../engine/fortune'

const props = defineProps<{ overview: BaziOverview | null }>()

const WUXING_KEYS: Record<string, string> = {
  木: '木', 火: '火', 土: '土', 金: '金', 水: '水'
}

function wxLabel(k: string): string {
  return WUXING_KEYS[k] ?? k
}

const hasWuxing = computed(() => {
  const w = props.overview?.wuxingCount
  if (!w) return false
  return Object.values(w).some((v) => v > 0)
})
</script>

<style scoped>
.pillars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0;
}
.pillar {
  text-align: center;
  padding: 10px 4px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
}
.pillar.unknown { opacity: 0.6; }
.pillar-label {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 4px;
}
.pillar-gz {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text);
}
.note { margin: 6px 0 0; line-height: 1.7; }
h3 {
  font-size: 16px;
  margin: 14px 0 6px;
}
.qiyun-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 16px;
}
.qiyun-row span { color: var(--muted); }
.wx-row { display: flex; flex-wrap: wrap; gap: 6px; }
.wx-chip {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 15px;
}
.nayin-line {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 15px;
}
.nayin-line span {
  display: inline-block;
  min-width: 1.5em;
  color: var(--muted);
}
</style>

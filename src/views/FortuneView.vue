<template>
  <h1>运势</h1>

  <!-- 出生资料输入 -->
  <BirthInputCard @compute="onCompute" />

  <!-- 八字概览 -->
  <BaziOverviewCard v-if="overview" :overview="overview" />

  <!-- 大运时间轴：仅 exact_time 且 gender 非 unspecified -->
  <DaYunTimeline
    v-if="showDaYun"
    :entries="daYun"
  />

  <!-- 流年列表：仅 exact_time 且 gender 非 unspecified -->
  <LiuNianList
    v-if="showDaYun"
    :entries="liuNian"
  />

  <!-- 京房十六变研究层 -->
  <JingFang16Card
    v-if="profile"
    :profile="profile"
  />

  <!-- 免责声明 -->
  <FortuneDisclaimer />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BirthInputCard from '../components/fortune/BirthInputCard.vue'
import BaziOverviewCard from '../components/fortune/BaziOverviewCard.vue'
import DaYunTimeline from '../components/fortune/DaYunTimeline.vue'
import LiuNianList from '../components/fortune/LiuNianList.vue'
import JingFang16Card from '../components/fortune/JingFang16Card.vue'
import FortuneDisclaimer from '../components/fortune/FortuneDisclaimer.vue'
import {
  computeBaziOverview,
  computeDaYun,
  computeLiuNian,
  type BirthProfile,
  type BaziOverview,
  type DaYunEntry,
  type LiuNianEntry
} from '../engine/fortune'

const profile = ref<BirthProfile | null>(null)
const overview = ref<BaziOverview | null>(null)
const daYun = ref<DaYunEntry[]>([])
const liuNian = ref<LiuNianEntry[]>([])

/** 只有完整时辰 + 选择了男/女，才计算传统精确大运与流年 */
const showDaYun = computed(
  () =>
    !!profile.value &&
    profile.value.precision === 'exact_time' &&
    profile.value.traditionalGenderParam !== 'unspecified'
)

function onCompute(p: BirthProfile) {
  profile.value = p
  try {
    overview.value = computeBaziOverview(p)
  } catch {
    overview.value = null
  }

  if (p.precision === 'exact_time' && p.traditionalGenderParam !== 'unspecified') {
    try {
      // 多取几步，前端按年龄范围裁剪
      daYun.value = computeDaYun(p, 14)
      liuNian.value = computeLiuNian(p, [0, 120])
    } catch {
      daYun.value = []
      liuNian.value = []
    }
  } else {
    daYun.value = []
    liuNian.value = []
  }
}
</script>
